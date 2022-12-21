/* eslint-disable @typescript-eslint/ban-ts-comment */
import {
  DynamicModule,
  MiddlewareConsumer,
  Module,
  NestModule,
} from '@nestjs/common';
import { context, trace } from '@opentelemetry/api';

import {
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

@Module({})
export class OpenTelemetrySetupModule
  extends OpenTelemetryModule
  implements NestModule
{
  static async fromRoot(
    configuration: Partial<OpenTelemetryModuleConfig> = {},
  ): Promise<DynamicModule> {
    const fromRoot = await super.forRoot({
      ...configuration,
      traceAutoInjectors: this.traceAutoInjectors(),
      // @ts-ignore
      spanProcessor: new SimpleSpanProcessor(
        new JaegerExporter(this.jaegerExporterOptions()),
      ),
    });

    return {
      ...fromRoot,
    };
  }

  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply((req, res, next) => {
        const spanContext = trace.getSpan(context.active())?.spanContext();
        res.set('x-traceid', spanContext?.traceId);
        next();
      })
      .forRoutes('*');
  }

  static traceAutoInjectors(): Array<any> {
    return [
      ControllerInjector,
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
