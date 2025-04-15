package org.panorama.walkthrough.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * @author WangZx
 * @version 1.0
 * @className DepthEstimateMessage
 * @date 2025/4/11
 * @createTime 15:24
 * @Description 深度估计服务消息队列message POJO类
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class DepthEstimateMessage {

    private String userId;
    private String projectId;
    private String imageName;
}
