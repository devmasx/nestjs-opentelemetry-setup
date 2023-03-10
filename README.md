# nestjs-opentelemetry-setup

Configure opentelemetry traces by default with `JaegerExporter`, this module is a extends from https://github.com/MetinSeylan/Nestjs-OpenTelemetry

![jaeger-trace.png](./images//jaeger-trace.png)
## Usage

```ts
import { Module } from '@nestjs/common';
import { OpenTelemetrySetupModule } from 'nestjs-opentelemetry-setup';

@Module({
  imports: [
    OpenTelemetrySetupModule.forRoot({
      serviceName: 'my-app',
    }),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
```

### Trace id response header

All responses contains response header `x-traceid` with the trace id

Usefull to search the trace in jaeger:

http://localhost:16686/trace/${traceId}

#### Trace Decorators
This library supports auto instrumentations for Nestjs layers, but sometimes you need to define custom span for specific method blocks like providers methods. In this case `@Span` decorator will help you.
```ts
import { Injectable } from '@nestjs/common';
import { Span } from 'nestjs-opentelemetry-setup';
@Injectable()
export class AppService {
  @Span()
  getHello(): string {
    return 'Hello World!';
  }
}
```
Also `@Span` decorator takes `name` field as a parameter
```ts
@Span('hello')
```
***
#### Trace Providers

`TraceService` can access directly current span context and start new span.
```ts
import { Injectable } from '@nestjs/common';
import { TraceService } from 'nestjs-opentelemetry-setup';
@Injectable()
export class AppService {
  constructor(private readonly traceService: TraceService) {}
  getHello(): string {
    const span = this.traceService.startSpan('span_name');
    // do something
    span.end();
    return 'Hello World!';
  }
}
```

#### Custom configuration for Instrumentations

Apply configuration for http instrumentation, adding user id tag based on request header.

```ts
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';

OpenTelemetrySetupModule.forRoot({
  serviceName: 'my-app',
  instrumentations: [
    getNodeAutoInstrumentations({
      '@opentelemetry/instrumentation-http': {
        applyCustomAttributesOnSpan: (span, request: any, response: any) => {
          span.setAttribute('user_id', request.headers['x-user-id']);
          span.setAttribute('language', request.headers['language']);
        },
      },
    }),
  ],
}),
```

More information about other OpenTelemetry instrumentation configuration: https://www.npmjs.com/package/@opentelemetry/auto-instrumentations-node

### Jaeger UI

```yml
version: '3.7'
services:
  jaeger:
    image: jaegertracing/all-in-one:1.40
    environment:
      COLLECTOR_ZIPKIN_HOST_PORT: ':9411'
      COLLECTOR_OTLP_ENABLED: "false"
    ports:
      - "6831:6831/udp"
      - "6832:6832/udp"
      - "5778:5778"
      - "16686:16686"
      - "4317:4317"
      - "4318:4318"
      - "14250:14250"
      - "14268:14268"
      - "14269:14269"
      - "9411:9411"
```

```
docker compose up
```
Open UI: http://localhost:16686/search

### Extends

This module is equivalent to:

```ts
import {
  ControllerInjector,
  LoggerInjector,
  OpenTelemetryModule,
} from '@metinseylan/nestjs-opentelemetry';
import { JaegerExporter } from '@opentelemetry/exporter-jaeger';
import { SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base';

OpenTelemetryModule.forRoot({
  serviceName: 'my-app',
  traceAutoInjectors: [
    ControllerInjector,
    GuardInjector,
    EventEmitterInjector,
    ScheduleInjector,
    PipeInjector,
    LoggerInjector,
  ],
  spanProcessor: new SimpleSpanProcessor(new JaegerExporter()),
})
```
