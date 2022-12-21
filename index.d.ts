import { DynamicModule, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { OpenTelemetryModule, OpenTelemetryModuleConfig } from '@metinseylan/nestjs-opentelemetry';
export { Span, TraceService } from '@metinseylan/nestjs-opentelemetry';
import { ExporterConfig } from '@opentelemetry/exporter-jaeger';
export declare class OpenTelemetrySetupModule extends OpenTelemetryModule implements NestModule {
    static forRoot(configuration?: Partial<OpenTelemetryModuleConfig>): Promise<DynamicModule>;
    configure(consumer: MiddlewareConsumer): void;
    static traceAutoInjectors(): Array<any>;
    static jaegerExporterOptions(): ExporterConfig;
}
