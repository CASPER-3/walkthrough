package org.panorama.walkthrough.service.resource;

import org.springframework.web.multipart.MultipartFile;

/**
 * @author WangZx
 * @version 1.0
 * @className ResourceService
 * @date 2024/6/5
 * @createTime 14:45
 * @Description TODO
 */
public interface ResourceService {

    String uploadPic(MultipartFile file, String userId, String projectId, String picId);

    String addSkybox(MultipartFile file, String sceneName,
                     String userId, String projectId,
                     String picId, String skyboxId);

    String addNavi( MultipartFile file,  String naviName,
             String userId,  String projectId,
             String picId,  String naviId,  String skyboxId);

    String uploadModel( MultipartFile file,  String userId,  String projectId,  String modelId);

    String uploadConfigFile(String configFile,  String userId,  String projectId);

    String updateConfigFile(String configFile,  String userId,  String projectId);

    String predictPosition(String userId, String projectId);
}