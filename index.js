"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var OpenTelemetrySetupModule_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenTelemetrySetupModule = exports.TraceService = exports.Span = void 0;
const common_1 = require("@nestjs/common");
require("reflect-metadata");
const api_1 = require("@opentelemetry/api");
const nestjs_opentelemetry_1 = require("@metinseylan/nestjs-opentelemetry");
var nestjs_opentelemetry_2 = require("@metinseylan/nestjs-opentelemetry");
Object.defineProperty(exports, "Span", { enumerable: true, get: function () { return nestjs_opentelemetry_2.Span; } });
Object.defineProperty(exports, "TraceService", { enumerable: true, get: function () { return nestjs_opentelemetry_2.TraceService; } });
const exporter_jaeger_1 = require("@opentelemetry/exporter-jaeger");
const sdk_trace_base_1 = require("@opentelemetry/sdk-trace-base");
class ControllerInjectorWithError extends nestjs_opentelemetry_1.ControllerInjector {
    wrap(prototype, traceName, attributes = {}) {
        const method = {
            [prototype.name]: function (...args) {
                const tracer = api_1.trace.getTracer('default');
                const currentSpan = tracer.startSpan(traceName);
                return api_1.context.with(api_1.trace.setSpan(api_1.context.active(), currentSpan), () => {
                    currentSpan.setAttributes(attributes);
                    if (prototype.constructor.name === 'AsyncFunction') {
                        return prototype
                            .apply(this, args)
                            .catch((error) => ControllerInjectorWithError.recordException(error, currentSpan))
                            .finally(() => {
                            currentSpan.end();
                        });
                    }
                    else {
                        try {
                            const result = prototype.apply(this, args);
                            currentSpan.end();
                            return result;
                        }
                        catch (error) {
                            ControllerInjectorWithError.recordException(error, currentSpan);
                        }
                        finally {
                            currentSpan.end();
                        }
                    }
                });
            },
        }[prototype.name];
        Reflect.defineMetadata(nestjs_opentelemetry_1.Constants.TRACE_METADATA, traceName, method);
        this.affect(method);
        this.reDecorate(prototype, method);
        return method;
    }
    static recordException(error, span) {
        var _a;
        span.recordException(error);
        span.setStatus({ code: api_1.SpanStatusCode.ERROR, message: error.message });
        span.setAttributes({
            track_error: true,
            error_type: ((_a = error.constructor) === null || _a === void 0 ? void 0 : _a.name) || error.name,
            error_message: error.message,
        });
        throw error;
    }
}
let OpenTelemetrySetupModule = OpenTelemetrySetupModule_1 = class OpenTelemetrySetupModule extends nestjs_opentelemetry_1.OpenTelemetryModule {
    static async forRoot(configuration = {}) {
        const forRoot = await super.forRoot(Object.assign(Object.assign({}, configuration), { traceAutoInjectors: this.traceAutoInjectors(), spanProcessor: new sdk_trace_base_1.SimpleSpanProcessor(new exporter_jaeger_1.JaegerExporter(this.jaegerExporterOptions())) }));
        return Object.assign(Object.assign({}, forRoot), { module: OpenTelemetrySetupModule_1 });
    }
    configure(consumer) {
        consumer
            .apply((req, res, next) => {
            var _a;
            const spanContext = (_a = api_1.trace.getSpan(api_1.context.active())) === null || _a === void 0 ? void 0 : _a.spanContext();
            res.set('x-traceid', (spanContext === null || spanContext === void 0 ? void 0 : spanContext.traceId) || 'unknown');
            next();
        })
            .forRoutes('*');
    }
    static traceAutoInjectors() {
        return [
            ControllerInjectorWithError,
            nestjs_opentelemetry_1.GuardInjector,
            nestjs_opentelemetry_1.EventEmitterInjector,
            nestjs_opentelemetry_1.ScheduleInjector,
            nestjs_opentelemetry_1.PipeInjector,
            nestjs_opentelemetry_1.LoggerInjector,
        ];
    }
    static jaegerExporterOptions() {
        return {};
    }
};
OpenTelemetrySetupModule = OpenTelemetrySetupModule_1 = __decorate([
    (0, common_1.Module)({})
], OpenTelemetrySetupModule);
exports.OpenTelemetrySetupModule = OpenTelemetrySetupModule;
