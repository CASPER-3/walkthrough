package org.panorama.walkthrough.service.algorithm;

import io.nats.client.*;

import java.nio.charset.StandardCharsets;

/**
 * @author WangZx
 * @version 1.0
 * @className DepthEstimateMQServiceImpl
 * @date 2025/3/31
 * @createTime 15:23
 * @Description TODO
 */
public class DepthEstimateMQServiceImpl extends DepthEstimateService {
    @Override
    Boolean doDepthEstimate(String imageDir, String imgName) {
        return null;
    }

    public static void main(String[] args) {

        try (Connection natsConnection = Nats.connect("nats://localhost:4222")) {
            // 发送深度估计任务
            String task = "{\"userId\": \"123\", \"projectId\": \"456\", \"picId\": \"789\", \"imageName\": \"test.jpg\"}";
            natsConnection.publish("depth_estimate", task.getBytes(StandardCharsets.UTF_8));
            System.out.println("Task sent: " + task);

            // 监听 Python 返回的计算结果
            Dispatcher dispatcher = natsConnection.createDispatcher((msg) -> {
                String response = new String(msg.getData(), StandardCharsets.UTF_8);
                System.out.println("Received result: " + response);
            });
            dispatcher.subscribe("depth_result");

            // 保持连接
            Thread.sleep(10000);

        } catch (Exception e) {
            e.printStackTrace();
        }

    }
}
