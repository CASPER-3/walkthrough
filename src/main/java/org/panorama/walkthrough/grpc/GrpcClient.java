package org.panorama.walkthrough.grpc;

import io.grpc.ManagedChannel;
import io.grpc.ManagedChannelBuilder;



/**
 * @author WangZx
 * @version 1.0
 * @className GrpcClient
 * @date 2024/6/6
 * @createTime 15:11
 * @Description TODO
 */

public class GrpcClient {

    private final ManagedChannel channel;
    private final Dust3rServiceGrpc.Dust3rServiceBlockingStub blockingStub;

    public GrpcClient(String host,int port) {
        this.channel = ManagedChannelBuilder.forAddress(host,port).usePlaintext().build();
        this.blockingStub = Dust3rServiceGrpc.newBlockingStub(channel);
    }

    public String compute(String input) {
        ComputeRequest request = ComputeRequest.newBuilder().setMessage(input).build();
        ComputeResponse response = blockingStub.compute(request);
        return response.getResult();
    }

    public void shutdown() throws InterruptedException {
        channel.shutdown();
    }
}
