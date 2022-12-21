"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenTelemetrySetupModule = exports.TraceService = exports.Span = void 0;
const common_1 = require("@nestjs/common");
const api_1 = require("@opentelemetry/api");
const nestjs_opentelemetry_1 = require("@metinseylan/nestjs-opentelemetry");
var nestjs_opentelemetry_2 = require("@metinseylan/nestjs-opentelemetry");
Object.defineProperty(exports, "Span", { enumerable: true, get: function () { return nestjs_opentelemetry_2.Span; } });
Object.defineProperty(exports, "TraceService", { enumerable: true, get: function () { return nestjs_opentelemetry_2.TraceService; } });
const exporter_jaeger_1 = require("@opentelemetry/exporter-jaeger");
const sdk_trace_base_1 = require("@opentelemetry/sdk-trace-base");
let OpenTelemetrySetupModule = class OpenTelemetrySetupModule extends nestjs_opentelemetry_1.OpenTelemetryModule {
    static async fromRoot(configuration = {}) {
        const fromRoot = await super.forRoot(Object.assign(Object.assign({}, configuration), { traceAutoInjectors: this.traceAutoInjectors(), spanProcessor: new sdk_trace_base_1.SimpleSpanProcessor(new exporter_jaeger_1.JaegerExporter(this.jaegerExporterOptions())) }));
        return Object.assign({}, fromRoot);
    }
    configure(consumer) {
        consumer
            .apply((req, res, next) => {
            var _a;
            const spanContext = (_a = api_1.trace.getSpan(api_1.context.active())) === null || _a === void 0 ? void 0 : _a.spanContext();
            res.set('x-traceid', spanContext === null || spanContext === void 0 ? void 0 : spanContext.traceId);
            next();
        })
            .forRoutes('*');
    }
    static traceAutoInjectors() {
        return [
            nestjs_opentelemetry_1.ControllerInjector,
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
OpenTelemetrySetupModule = __decorate([
    (0, common_1.Module)({})
], OpenTelemetrySetupModule);
exports.OpenTelemetrySetupModule = OpenTelemetrySetupModule;
