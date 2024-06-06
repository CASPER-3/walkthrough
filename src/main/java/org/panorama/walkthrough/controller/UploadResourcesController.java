package org.panorama.walkthrough.controller;

import lombok.RequiredArgsConstructor;
import org.panorama.walkthrough.service.resource.ResourceService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

/**
 * @author WangZx
 * @version 1.0
 * @className UploadResourcesController
 * @date 2023/3/1
 * @createTime 16:45
 */
@RestController
@RequiredArgsConstructor
public class UploadResourcesController {

    private final ResourceService resourceService;

    /**
     * 前端创建项目页面 '添加场景' 调用的接口,将前端传入的全景图存储为文件,存储路径:项目工作路径/userData/projectResources/{userId}/{projectId}/{picId}
     *
     * @param file      转换为 'cubeMap' 的场景全景图贴图
     * @param userId
     * @param projectId
     * @param picId
     * @return statusInfo
     */
    @PostMapping("/uploadPic/{userId}/{projectId}/{picId}")
    String uploadPic(@RequestParam("file") MultipartFile file, @PathVariable("userId") String userId, @PathVariable("projectId") String projectId, @PathVariable("picId") String picId) {

        return resourceService.uploadPic(file,userId,projectId,picId);

    }

    /**
     * 前端可视化编辑页面 ‘添加场景’ 功能调用的接口,存储全景图文件并更新服务器上的项目配置文件.
     *
     * @param file      转换为 'cubeMap' 的场景全景图贴图
     * @param sceneName 添加的场景名称
     * @param userId    用户id
     * @param projectId 项目的存储id\configurationId
     * @param picId     添加的贴图id
     * @param skyboxId  添加的天空盒id
     * @return statusInfo   {code|返回给前端的状态码,msg|返回给前端的信息,sceneName,skyboxId,tetureUrl}
     */
    @PostMapping("/addSkybox/{userId}/{projectId}/{picId}/{skyboxId}")
    String addSkybox(@RequestParam("file") MultipartFile file, @RequestParam("sceneName") String sceneName,
                     @PathVariable("userId") String userId, @PathVariable("projectId") String projectId,
                     @PathVariable("picId") String picId, @PathVariable("skyboxId") String skyboxId) {

        return resourceService.addSkybox(file,sceneName,userId,projectId,picId,skyboxId);
    }

    /**
     * 前端可视化编辑页面 ‘添加热点’ 功能调用的接口,存储热点贴图文件并更新服务器上的项目配置文件.
     *
     * @param file      热点贴图文件
     * @param naviName  热点名称
     * @param userId    项目所属用户id
     * @param projectId 项目的配置文件id
     * @param picId     热点贴图id
     * @param naviId    热点id
     * @param skyboxId  热点绑定的场景天空盒id
     * @return statusInfo   {code|返回给前端的状态码,msg|返回给前端的信息,naviName,naviId,textureUrl,map}
     */
    @PostMapping("/addNavi/{userId}/{projectId}/{picId}/{naviId}/{skyboxId}")
    String addNavi(@RequestParam("file") MultipartFile file, @RequestParam("naviName") String naviName,
                   @PathVariable("userId") String userId, @PathVariable("projectId") String projectId,
                   @PathVariable("picId") String picId, @PathVariable("naviId") String naviId, @PathVariable("skyboxId") String skyboxId) {

        return resourceService.addNavi(file,naviName,userId,projectId,picId,naviId,skyboxId);

    }

    /**
     * 前端创建项目页面上传空间模型调用的接口,将模型文件按id存储为文件.
     *
     * @param file      空间模型文件
     * @param userId
     * @param projectId
     * @param modelId
     * @return statusInfo
     */
    @PostMapping("/uploadModel/{userId}/{projectId}/{modelId}")
    String uploadModel(@RequestParam("file") MultipartFile file, @PathVariable("userId") String userId, @PathVariable("projectId") String projectId, @PathVariable("modelId") String modelId) {

        return resourceService.uploadModel(file,userId,projectId,modelId);

    }

    /**
     * 前端创建项目页面,创建项目调用的接口,将前端传入的json字符串生成配置文件并存储为文件,h2数据库项目表插入新项目并保存相关信息.
     *
     * @param configFile
     * @param userId
     * @param projectId
     * @return statusInfo
     */
    @PostMapping("/uploadConfigFile/{userId}/{projectId}")
    String uploadConfigFile(@RequestBody String configFile, @PathVariable("userId") String userId, @PathVariable("projectId") String projectId) {

        return resourceService.uploadConfigFile(configFile,userId,projectId);
    }

    /**
     * 前端可视化编辑页面 ‘保存全景漫游’ 功能调用的接口,使用前端传入的json字符串覆盖服务器对应的项目配置文件.
     *
     * @param configFile
     * @param userId
     * @param projectId
     * @return statusInfo
     */
    @PostMapping("/updateConfigFile/{userId}/{projectId}")
    String updateConfigFile(@RequestBody String configFile, @PathVariable("userId") String userId, @PathVariable("projectId") String projectId) {
        return resourceService.updateConfigFile(configFile,userId,projectId);
    }

    @GetMapping("/dust3r/{userId}/{projectId}")
    ResponseEntity<String> dust3r(@PathVariable("userId") String userId, @PathVariable("projectId") String projectId) {
       Boolean res = resourceService.predictPosition(userId,projectId);
       if(!res){
           return ResponseEntity.badRequest().body("点位预测算法运行失败");
       }
       return ResponseEntity.ok("点位预测成功");
    }

}