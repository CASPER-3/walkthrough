package org.panorama.walkthrough.grpc;

import static io.grpc.MethodDescriptor.generateFullMethodName;

/**
 */
@javax.annotation.Generated(
    value = "by gRPC proto compiler (version 1.64.0)",
    comments = "Source: dust3rServiceProto.proto")
@io.grpc.stub.annotations.GrpcGenerated
public final class Dust3rServiceGrpc {

  private Dust3rServiceGrpc() {}

  public static final String SERVICE_NAME = "dust3r.Dust3rService";

  // Static method descriptors that strictly reflect the proto.
  private static volatile io.grpc.MethodDescriptor<ComputeRequest,
      ComputeResponse> getComputeMethod;

  @io.grpc.stub.annotations.RpcMethod(
      fullMethodName = SERVICE_NAME + '/' + "Compute",
      requestType = ComputeRequest.class,
      responseType = ComputeResponse.class,
      methodType = io.grpc.MethodDescriptor.MethodType.UNARY)
  public static io.grpc.MethodDescriptor<ComputeRequest,
      ComputeResponse> getComputeMethod() {
    io.grpc.MethodDescriptor<ComputeRequest, ComputeResponse> getComputeMethod;
    if ((getComputeMethod = Dust3rServiceGrpc.getComputeMethod) == null) {
      synchronized (Dust3rServiceGrpc.class) {
        if ((getComputeMethod = Dust3rServiceGrpc.getComputeMethod) == null) {
          Dust3rServiceGrpc.getComputeMethod = getComputeMethod =
              io.grpc.MethodDescriptor.<ComputeRequest, ComputeResponse>newBuilder()
              .setType(io.grpc.MethodDescriptor.MethodType.UNARY)
              .setFullMethodName(generateFullMethodName(SERVICE_NAME, "Compute"))
              .setSampledToLocalTracing(true)
              .setRequestMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  ComputeRequest.getDefaultInstance()))
              .setResponseMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  ComputeResponse.getDefaultInstance()))
              .setSchemaDescriptor(new Dust3rServiceMethodDescriptorSupplier("Compute"))
              .build();
        }
      }
    }
    return getComputeMethod;
  }

  /**
   * Creates a new async stub that supports all call types for the service
   */
  public static Dust3rServiceStub newStub(io.grpc.Channel channel) {
    io.grpc.stub.AbstractStub.StubFactory<Dust3rServiceStub> factory =
      new io.grpc.stub.AbstractStub.StubFactory<Dust3rServiceStub>() {
        @Override
        public Dust3rServiceStub newStub(io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
          return new Dust3rServiceStub(channel, callOptions);
        }
      };
    return Dust3rServiceStub.newStub(factory, channel);
  }

  /**
   * Creates a new blocking-style stub that supports unary and streaming output calls on the service
   */
  public static Dust3rServiceBlockingStub newBlockingStub(
      io.grpc.Channel channel) {
    io.grpc.stub.AbstractStub.StubFactory<Dust3rServiceBlockingStub> factory =
      new io.grpc.stub.AbstractStub.StubFactory<Dust3rServiceBlockingStub>() {
        @Override
        public Dust3rServiceBlockingStub newStub(io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
          return new Dust3rServiceBlockingStub(channel, callOptions);
        }
      };
    return Dust3rServiceBlockingStub.newStub(factory, channel);
  }

  /**
   * Creates a new ListenableFuture-style stub that supports unary calls on the service
   */
  public static Dust3rServiceFutureStub newFutureStub(
      io.grpc.Channel channel) {
    io.grpc.stub.AbstractStub.StubFactory<Dust3rServiceFutureStub> factory =
      new io.grpc.stub.AbstractStub.StubFactory<Dust3rServiceFutureStub>() {
        @Override
        public Dust3rServiceFutureStub newStub(io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
          return new Dust3rServiceFutureStub(channel, callOptions);
        }
      };
    return Dust3rServiceFutureStub.newStub(factory, channel);
  }

  /**
   */
  public interface AsyncService {

    /**
     */
    default void compute(ComputeRequest request,
                         io.grpc.stub.StreamObserver<ComputeResponse> responseObserver) {
      io.grpc.stub.ServerCalls.asyncUnimplementedUnaryCall(getComputeMethod(), responseObserver);
    }
  }

  /**
   * Base class for the server implementation of the service Dust3rService.
   */
  public static abstract class Dust3rServiceImplBase
      implements io.grpc.BindableService, AsyncService {

    @Override public final io.grpc.ServerServiceDefinition bindService() {
      return Dust3rServiceGrpc.bindService(this);
    }
  }

  /**
   * A stub to allow clients to do asynchronous rpc calls to service Dust3rService.
   */
  public static final class Dust3rServiceStub
      extends io.grpc.stub.AbstractAsyncStub<Dust3rServiceStub> {
    private Dust3rServiceStub(
        io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
      super(channel, callOptions);
    }

    @Override
    protected Dust3rServiceStub build(
        io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
      return new Dust3rServiceStub(channel, callOptions);
    }

    /**
     */
    public void compute(ComputeRequest request,
                        io.grpc.stub.StreamObserver<ComputeResponse> responseObserver) {
      io.grpc.stub.ClientCalls.asyncUnaryCall(
          getChannel().newCall(getComputeMethod(), getCallOptions()), request, responseObserver);
    }
  }

  /**
   * A stub to allow clients to do synchronous rpc calls to service Dust3rService.
   */
  public static final class Dust3rServiceBlockingStub
      extends io.grpc.stub.AbstractBlockingStub<Dust3rServiceBlockingStub> {
    private Dust3rServiceBlockingStub(
        io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
      super(channel, callOptions);
    }

    @Override
    protected Dust3rServiceBlockingStub build(
        io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
      return new Dust3rServiceBlockingStub(channel, callOptions);
    }

    /**
     */
    public ComputeResponse compute(ComputeRequest request) {
      return io.grpc.stub.ClientCalls.blockingUnaryCall(
          getChannel(), getComputeMethod(), getCallOptions(), request);
    }
  }

  /**
   * A stub to allow clients to do ListenableFuture-style rpc calls to service Dust3rService.
   */
  public static final class Dust3rServiceFutureStub
      extends io.grpc.stub.AbstractFutureStub<Dust3rServiceFutureStub> {
    private Dust3rServiceFutureStub(
        io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
      super(channel, callOptions);
    }

    @Override
    protected Dust3rServiceFutureStub build(
        io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
      return new Dust3rServiceFutureStub(channel, callOptions);
    }

    /**
     */
    public com.google.common.util.concurrent.ListenableFuture<ComputeResponse> compute(
        ComputeRequest request) {
      return io.grpc.stub.ClientCalls.futureUnaryCall(
          getChannel().newCall(getComputeMethod(), getCallOptions()), request);
    }
  }

  private static final int METHODID_COMPUTE = 0;

  private static final class MethodHandlers<Req, Resp> implements
      io.grpc.stub.ServerCalls.UnaryMethod<Req, Resp>,
      io.grpc.stub.ServerCalls.ServerStreamingMethod<Req, Resp>,
      io.grpc.stub.ServerCalls.ClientStreamingMethod<Req, Resp>,
      io.grpc.stub.ServerCalls.BidiStreamingMethod<Req, Resp> {
    private final AsyncService serviceImpl;
    private final int methodId;

    MethodHandlers(AsyncService serviceImpl, int methodId) {
      this.serviceImpl = serviceImpl;
      this.methodId = methodId;
    }

    @Override
    @SuppressWarnings("unchecked")
    public void invoke(Req request, io.grpc.stub.StreamObserver<Resp> responseObserver) {
      switch (methodId) {
        case METHODID_COMPUTE:
          serviceImpl.compute((ComputeRequest) request,
              (io.grpc.stub.StreamObserver<ComputeResponse>) responseObserver);
          break;
        default:
          throw new AssertionError();
      }
    }

    @Override
    @SuppressWarnings("unchecked")
    public io.grpc.stub.StreamObserver<Req> invoke(
        io.grpc.stub.StreamObserver<Resp> responseObserver) {
      switch (methodId) {
        default:
          throw new AssertionError();
      }
    }
  }

  public static final io.grpc.ServerServiceDefinition bindService(AsyncService service) {
    return io.grpc.ServerServiceDefinition.builder(getServiceDescriptor())
        .addMethod(
          getComputeMethod(),
          io.grpc.stub.ServerCalls.asyncUnaryCall(
            new MethodHandlers<
              ComputeRequest,
              ComputeResponse>(
                service, METHODID_COMPUTE)))
        .build();
  }

  private static abstract class Dust3rServiceBaseDescriptorSupplier
      implements io.grpc.protobuf.ProtoFileDescriptorSupplier, io.grpc.protobuf.ProtoServiceDescriptorSupplier {
    Dust3rServiceBaseDescriptorSupplier() {}

    @Override
    public com.google.protobuf.Descriptors.FileDescriptor getFileDescriptor() {
      return Dust3RServiceProto.getDescriptor();
    }

    @Override
    public com.google.protobuf.Descriptors.ServiceDescriptor getServiceDescriptor() {
      return getFileDescriptor().findServiceByName("Dust3rService");
    }
  }

  private static final class Dust3rServiceFileDescriptorSupplier
      extends Dust3rServiceBaseDescriptorSupplier {
    Dust3rServiceFileDescriptorSupplier() {}
  }

  private static final class Dust3rServiceMethodDescriptorSupplier
      extends Dust3rServiceBaseDescriptorSupplier
      implements io.grpc.protobuf.ProtoMethodDescriptorSupplier {
    private final String methodName;

    Dust3rServiceMethodDescriptorSupplier(String methodName) {
      this.methodName = methodName;
    }

    @Override
    public com.google.protobuf.Descriptors.MethodDescriptor getMethodDescriptor() {
      return getServiceDescriptor().findMethodByName(methodName);
    }
  }

  private static volatile io.grpc.ServiceDescriptor serviceDescriptor;

  public static io.grpc.ServiceDescriptor getServiceDescriptor() {
    io.grpc.ServiceDescriptor result = serviceDescriptor;
    if (result == null) {
      synchronized (Dust3rServiceGrpc.class) {
        result = serviceDescriptor;
        if (result == null) {
          serviceDescriptor = result = io.grpc.ServiceDescriptor.newBuilder(SERVICE_NAME)
              .setSchemaDescriptor(new Dust3rServiceFileDescriptorSupplier())
              .addMethod(getComputeMethod())
              .build();
        }
      }
    }
    return result;
  }
}
