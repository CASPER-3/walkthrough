package org.panorama.walkthrough.service.algorithm;

import org.panorama.walkthrough.service.mq.RabbitMqPublisherService;

import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

/**
 * @author WangZx
 * @version 1.0
 * @className DepthEstimateMQServiceImpl
 * @date 2025/3/31
 * @createTime 15:23
 * @Description
 */
@Primary
@Service
public class DepthEstimateMQServiceImpl extends DepthEstimateService {

    private final RabbitMqPublisherService rabbitMqPublisherService;

    public DepthEstimateMQServiceImpl(RabbitMqPublisherService rabbitMqPublisherService) {
        this.rabbitMqPublisherService = rabbitMqPublisherService;
    }

    @Override
    Boolean doDepthEstimate(String imageDir, String imgName) {
        return null;
    }

    @Override
    Boolean doDepthEstimate(MultipartFile file) throws IOException {
        try {
            rabbitMqPublisherService.publishImage(file);
        } catch (Exception e) {
            return false;
        }
        return true;
    }
}
