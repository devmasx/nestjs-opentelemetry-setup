/* eslint-disable @typescript-eslint/ban-ts-comment */
import {
  DynamicModule,
  MiddlewareConsumer,
  Module,
  NestModule,
} from '@nestjs/common';
import 'reflect-metadata';
import { context, Span, SpanStatusCode, trace } from '@opentelemetry/api';

import {
  Constants,
  ControllerInjector,
  EventEmitterInjector,
  GuardInjector,
  LoggerInjector,
  OpenTelemetryModule,
  OpenTelemetryModuleConfig,
  PipeInjector,
  ScheduleInjector,
} from '@metinseylan/nestjs-opentelemetry';
export { Span, TraceService } from '@metinseylan/nestjs-opentelemetry';

import { ExporterConfig, JaegerExporter } from '@opentelemetry/exporter-jaeger';
import { SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base';

class ControllerInjectorWithError extends ControllerInjector {
  protected wrap(prototype: Record<any, any>, traceName, attributes = {}) {
    const method = {
      [prototype.name]: function (...args: any[]) {
        const tracer = trace.getTracer('default');
        const currentSpan = tracer.startSpan(traceName);

        return context.with(
          trace.setSpan(context.active(), currentSpan),
          () => {
            currentSpan.setAttributes(attributes);
            if (prototype.constructor.name === 'AsyncFunction') {
              return prototype
                .apply(this, args)
                .catch((error) =>
                  ControllerInjectorWithError.recordException(
                    error,
                    currentSpan,
                  ),
                )
                .finally(() => {
                  currentSpan.end();
                });
            } else {
              try {
                const result = prototype.apply(this, args);
                currentSpan.end();
                return result;
              } catch (error) {
                ControllerInjectorWithError.recordException(error, currentSpan);
              } finally {
                currentSpan.end();
              }
            }
          },
        );
      },
    }[prototype.name];

    Reflect.defineMetadata(Constants.TRACE_METADATA, traceName, method);
    this.affect(method);
    this.reDecorate(prototype, method);

    return method;
  }

  protected static recordException(error, span: Span) {
    span.recordException(error);
    span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
    span.setAttributes({
      track_error: true,
      error_type: error.constructor?.name || error.name,
      error_message: error.message,
    });
    throw error;
  }
}

@Module({})
export class OpenTelemetrySetupModule
  extends OpenTelemetryModule
  implements NestModule
{
  static async forRoot(
    configuration: Partial<OpenTelemetryModuleConfig> = {},
  ): Promise<DynamicModule> {
    const forRoot = await super.forRoot({
      ...configuration,
      traceAutoInjectors: this.traceAutoInjectors(),
      // @ts-ignore
      spanProcessor: new SimpleSpanProcessor(
        new JaegerExporter(this.jaegerExporterOptions()),
      ),
    });

    return {
      ...forRoot,
      module: OpenTelemetrySetupModule,
    };
  }

  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply((req, res, next) => {
        const spanContext = trace.getSpan(context.active())?.spanContext();
        res.set('x-traceid', spanContext?.traceId || 'unknown');
        next();
      })
      .forRoutes('*');
  }

  static traceAutoInjectors(): Array<any> {
    return [
      ControllerInjectorWithError,
      GuardInjector,
      EventEmitterInjector,
      ScheduleInjector,
      PipeInjector,
      LoggerInjector,
    ];
  }

  static jaegerExporterOptions(): ExporterConfig {
    return {};
  }
}
