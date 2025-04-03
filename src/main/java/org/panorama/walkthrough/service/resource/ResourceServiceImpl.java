package org.panorama.walkthrough.service.resource;

import com.alibaba.fastjson2.JSON;
import com.alibaba.fastjson2.JSONArray;
import com.alibaba.fastjson2.JSONObject;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.panorama.walkthrough.grpc.GrpcClient;
import org.panorama.walkthrough.model.Project;
import org.panorama.walkthrough.repositories.ProjectRepository;
import org.panorama.walkthrough.service.algorithm.DepthEstimateService;
import org.panorama.walkthrough.service.algorithm.Dust3rService;
import org.panorama.walkthrough.service.algorithm.Equirectangular2CubeService;
import org.panorama.walkthrough.service.algorithm.ThumbGenerateService;
import org.panorama.walkthrough.service.storage.StorageService;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.sql.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * @author WangZx
 * @version 1.0
 * @className ResourceServiceImpl
 * @date 2024/6/5
 * @createTime 14:46
 * @Description TODO
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class ResourceServiceImpl implements ResourceService {

    private final StorageService storageService;
    @Qualifier("depthEstimateMQServiceImpl")
    private final DepthEstimateService depthEstimateService;
    private final Equirectangular2CubeService equirectangular2CubeService;
    private final Dust3rService dust3rService;
    private final ThumbGenerateService thumbGenerateService;
    private final ProjectRepository projectRepository;
    private final GrpcClient grpcClient = new GrpcClient("localhost", 50055);

    private final static AtomicInteger counter = new AtomicInteger(0);

    @Override
    public String uploadPic(MultipartFile file, String userId, String projectId, String picId) {


        String fileName = file.getOriginalFilename();
        log.info("Resources\t[Upload]\tPicture:" + fileName);
        JSONObject statusInfo = new JSONObject();
        statusInfo.put("code", 0);
        statusInfo.put("msg", "upload success");
        String prefix = userId + "/" + projectId + "/";
        storageService.store(file, prefix, picId);

        /**
         *  判断是否为ERP全景图，是的话调用生成深度图服务
         *  Wed,Oct18,2023
         */

        String erpSuffix = picId.substring(picId.length() - 3);

        if (erpSuffix.equals("erp")) {
            String suffix = fileName.substring(fileName.lastIndexOf('.'));
            String imageName = picId + suffix;

            try {

                depthEstimateService.depthEstimate(file);
                equirectangular2CubeService.equirectangular2Cube(prefix, imageName);
                int currentValue = counter.incrementAndGet();
                if (currentValue >= 2) {
                    //equirectangular2cube
                    try {
                        //call the dust3r service
                        Boolean dust3rResult = dust3rService.dust3r(prefix);
                        if (dust3rResult == false) {
                            log.error("dust3rResult is false");
                        }
                        while (!dust3rResult) {
                            dust3rService.dust3r(prefix);
                        }

                    } catch (Exception e) {
                        e.printStackTrace();
                    }

                }

            } catch (Exception ex) {

                System.out.println(ex.getMessage());

            }

            /**
             *  判断项目是否存在缩略图,没有的话调用生成缩略图服务
             *  Tue,Mar12,2024
             */
            String rootLocation = storageService.getLocation();
            Path path = Paths.get(rootLocation + '/' + prefix + "thumb.jpg");
            if (!Files.exists(path)) {

                try {

                    thumbGenerateService.thumbGenerate(prefix, imageName);

                } catch (Exception ex) {

                    System.out.println(ex.getMessage());

                }
            }

        }

        return JSON.toJSONString(statusInfo);

    }

    @Override
    public String addSkybox(MultipartFile file, String sceneName, String userId, String projectId, String picId, String skyboxId) {
        log.info("Request\t[Post]/addSkybox\tpath:/" + userId + "/" + projectId + "/" + picId + "/" + skyboxId);
        JSONObject statusInfo = new JSONObject();

        String configurationFilePath = userId + "/" + projectId + "/" + "projectConfig.json";
        byte[] configurationFile = storageService.readJsonFile(configurationFilePath);
        if (configurationFile.length == 0) {
            statusInfo.put("code", 1);
            statusInfo.put("msg", "add skybox failed");
        } else {
            String fileName = file.getOriginalFilename();
            String prefix = userId + "/" + projectId + "/";
            String suffix = fileName.substring(fileName.lastIndexOf('.'));
            String path = prefix + "projectConfig.json";
            statusInfo.put("code", 0);
            statusInfo.put("msg", "add skybox success");
            statusInfo.put("sceneName", sceneName);
            statusInfo.put("skyboxId", skyboxId);
            statusInfo.put("textureUrl", "/project/getEditSources/" + userId + "/" + projectId + "/" + picId + suffix);
            JSONObject configData = JSON.parseObject(configurationFile);
            JSONObject sceneData = configData.getJSONObject("scene");
            JSONArray skyboxData = sceneData.getJSONArray("skybox");
            JSONArray texturesData = configData.getJSONArray("textures");

            int offset = skyboxData.size();

            JSONObject newSkybox = skyboxData.addObject();
            JSONObject newTexture = texturesData.addObject();


            newTexture.put("id", picId);
            newTexture.put("name", sceneName);
            newTexture.put("type", "skybox");
            newTexture.put("url", "/project/getEditSources/" + userId + "/" + projectId + "/" + picId + suffix);

            newSkybox.put("name", sceneName);
            newSkybox.put("id", skyboxId);
            newSkybox.put("texture", new String[]{picId});

            JSONObject positionData = newSkybox.putObject("position");
            positionData.put("x", 0);
            positionData.put("y", 0);
            positionData.put("z", offset);

            JSONObject geometryScaleData = newSkybox.putObject("geometryScale");
            geometryScaleData.put("x", 1);
            geometryScaleData.put("y", 1);
            geometryScaleData.put("z", -1);

            JSONObject scaleData = newSkybox.putObject("scale");
            scaleData.put("x", 1);
            scaleData.put("y", 1);
            scaleData.put("z", 1);

            JSONObject rotationData = newSkybox.putObject("rotation");
            rotationData.put("x", 0);
            rotationData.put("y", 0);
            rotationData.put("z", 0);
            storageService.delete(path);
            try {
                storageService.store(file, prefix, picId);
                storageService.store(configData.toJSONString(), prefix);
            } catch (Exception ex) {

                System.out.println(ex.getMessage());

            }

        }

        return JSON.toJSONString(statusInfo);
    }

    @Override
    public String addNavi(MultipartFile file, String naviName, String userId, String projectId, String picId, String naviId, String skyboxId) {
        log.info("Request\t[Post]/addNavi\tpath:/" + userId + "/" + projectId + "/" + picId + "/" + naviId);
        JSONObject statusInfo = new JSONObject();

        String configurationFilePath = userId + "/" + projectId + "/" + "projectConfig.json";
        byte[] configurationFile = storageService.readJsonFile(configurationFilePath);
        if (configurationFile.length == 0) {
            statusInfo.put("code", 1);
            statusInfo.put("msg", "add navi failed");
        } else {
            String fileName = file.getOriginalFilename();
            String prefix = userId + "/" + projectId + "/";
            String suffix = fileName.substring(fileName.lastIndexOf('.'));
            String path = prefix + "projectConfig.json";
            statusInfo.put("code", 0);
            statusInfo.put("msg", "add navi success");
            statusInfo.put("naviName", naviName);
            statusInfo.put("naviId", naviId);
            statusInfo.put("textureUrl", "/project/getEditSources/" + userId + "/" + projectId + "/" + picId + suffix);
            statusInfo.put("map", skyboxId);
            JSONObject configData = JSON.parseObject(configurationFile);
            JSONObject sceneData = configData.getJSONObject("scene");
            JSONArray skyboxData = sceneData.getJSONArray("skybox");
            JSONArray naviData = sceneData.getJSONArray("navi");
            JSONArray texturesData = configData.getJSONArray("textures");
            Map<String, JSONObject> skyboxMap = new HashMap<>();
            for (int i = 0; i < skyboxData.size(); ++i) {
                skyboxMap.put(skyboxData.getJSONObject(i).getString("id"), skyboxData.getJSONObject(i));
            }


            JSONObject newNavi = naviData.addObject();
            JSONObject newTexture = texturesData.addObject();


            newTexture.put("id", picId);
            newTexture.put("name", naviName);
            newTexture.put("type", "navi");
            newTexture.put("url", "/project/getEditSources/" + userId + "/" + projectId + "/" + picId + suffix);

            newNavi.put("name", naviName);
            newNavi.put("id", naviId);
            newNavi.put("texture", picId);
            newNavi.put("map", skyboxId);

            JSONObject positionData = newNavi.putObject("position");
            JSONObject naviMapSkybox = skyboxMap.get(skyboxId);
            positionData.put("x", naviMapSkybox.getJSONObject("position").getIntValue("x"));
            positionData.put("y", naviMapSkybox.getJSONObject("position").getIntValue("y") - naviMapSkybox.getJSONObject("scale").getIntValue("y") / 2);
            positionData.put("z", naviMapSkybox.getJSONObject("position").getIntValue("z"));

            JSONObject geometryScaleData = newNavi.putObject("geometryScale");
            geometryScaleData.put("x", -1);
            geometryScaleData.put("y", 1);
            geometryScaleData.put("z", 1);

            JSONObject scaleData = newNavi.putObject("scale");
            scaleData.put("x", 1);
            scaleData.put("y", 1);
            scaleData.put("z", 1);

            JSONObject rotationData = newNavi.putObject("rotation");
            rotationData.put("x", 1.5707963267948966);
            rotationData.put("y", 0);
            rotationData.put("z", 0);
            storageService.delete(path);
            try {
                storageService.store(file, prefix, picId);
                storageService.store(configData.toJSONString(), prefix);
            } catch (Exception ex) {

                System.out.println(ex.getMessage());

            }

        }
        return JSON.toJSONString(statusInfo);
    }

    @Override
    public String uploadModel(MultipartFile file, String userId, String projectId, String modelId) {

        String fileName = file.getOriginalFilename();
        log.info("Resources\t[Upload]\tSpaceModel:" + fileName);
        JSONObject statusInfo = new JSONObject();
        statusInfo.put("code", 0);
        statusInfo.put("msg", "upload success");
        String prefix = userId + "/" + projectId + "/";
        storageService.store(file, prefix, modelId);

        return JSON.toJSONString(statusInfo);

    }

    @Override
    public String uploadConfigFile(String configFile, String userId, String projectId) {
        String prefix = userId + "/" + projectId + "/";
        log.info("Request\t[Post]/uploadConfigFile\tuserId:" + userId + " projectId:" + projectId);
        log.info("Resources\t[Upload]\t[Project Configuration File Create]\tID:" + projectId);
        JSONObject projectConfig = JSON.parseObject(configFile);
        JSONObject metaInfo = projectConfig.getJSONObject("metadata");


        //projectService.addProject();
        Project project = new Project();

        project.setProjectName(metaInfo.getString("name"));
        project.setUserId(metaInfo.getLong("userId"));
        project.setConfigFileId(metaInfo.getString("id"));
        project.setProjectPath(metaInfo.getString("path"));
        project.setProfile(metaInfo.getString("description"));
        project.setStatus(0);
        project.setCreationTime(new Date(System.currentTimeMillis()));
        try {
            project = projectRepository.save(project);

            Long dbProjectId = project.getProjectId();
            log.info("Project\t[ADD]    ProjectId:" + dbProjectId + " userId:" + project.getUserId());
            int endPos = configFile.indexOf("projectId");
            StringBuffer strBuffer = new StringBuffer();
            strBuffer.append(configFile.substring(0, endPos + 11));
            strBuffer.append(dbProjectId);
            strBuffer.append(configFile.substring(endPos + 13));

            storageService.store(strBuffer.toString(), prefix);
        } catch (Exception ex) {

            System.out.println(ex.getMessage());

        }

        try {
            dust3rService.dust3r(prefix);
        } catch (Exception ex) {
            System.out.println(ex.getMessage());

        }


        return "upload configFile success";
    }

    @Override
    public String updateConfigFile(String configFile, String userId, String projectId) {
        log.info("Resources\t[Upload]\t[Project Configuration File Update]\tProjectId:" + projectId);
        String prefix = userId + "/" + projectId + "/";
        String path = prefix + "projectConfig.json";
        storageService.delete(path);

        try {
            storageService.store(configFile, prefix);
        } catch (Exception ex) {

            System.out.println(ex.getMessage());

        }
        return "update configFile success";
    }

    /**
     * Grpc调用dust3r 点位预测服务
     *
     * @param userId
     * @param projectId
     * @return
     */
    @Override
    public Boolean predictPosition(String userId, String projectId) {
        String rootDir = userId + "/" + projectId + "/";
        String pathPrefix = "../../../../../../../userData/projectResources/";
        String fullRootDir = pathPrefix + rootDir + "dust3rInput/";
        log.info("Dust3r service\tProjectId:" + projectId);

        try{
            String res = grpcClient.compute(fullRootDir);
            return true;

        }catch(Exception ex){
            log.warn("grpc called failed:"+ex.getMessage());

        }

        return false;

//        try{
//            dust3rService.dust3r(prefix);
//        }catch(Exception e){
//            System.out.println(e.getMessage());
//            return "dust3r service fail";
//        }
//        return "dust3r service success";

    }
}
