package org.panorama.walkthrough.service.mq;

import lombok.extern.slf4j.Slf4j;
import org.panorama.walkthrough.model.DepthEstimateMessage;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;

/**
 * @author WangZx
 * @version 1.0
 * @className RabbitMqPublisherService
 * @date 2025/4/3
 * @createTime 16:27
 * @Description RabbitMQ消息发布服务
 */
@Service
@Slf4j
public class RabbitMqPublisherService {

    private final RabbitTemplate rabbitTemplate;
    private static final String EXCHANGE_NAME = "depth_estimation_exchange";
    private static final String ROUTING_KEY = "depth.estimate.request";

    public RabbitMqPublisherService(RabbitTemplate rabbitTemplate) {
        this.rabbitTemplate = rabbitTemplate;
    }

    public void publishImage(MultipartFile file) throws IOException {
        try {
            byte[] imageData = file.getBytes();
            rabbitTemplate.convertAndSend(EXCHANGE_NAME, ROUTING_KEY, imageData);
            log.info("Published image " + file.getOriginalFilename());

        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    // 提交深度估计任务.
    public void publishDepthEstimateMessage(DepthEstimateMessage depthEstimateMessage) throws IOException {
        if (depthEstimateMessage == null) {
            log.error("Attempt to public a null Depth estimate message.");
            return;
        }
        try {
            rabbitTemplate.convertAndSend(EXCHANGE_NAME, ROUTING_KEY, depthEstimateMessage);
            log.info("Published depth estimate message " + depthEstimateMessage.toString());
        } catch (Exception e) {
            log.error("Unexpected error publishing depth estimate message {}: {}",
                    depthEstimateMessage, e.getMessage(), e);
        }


    }
}
