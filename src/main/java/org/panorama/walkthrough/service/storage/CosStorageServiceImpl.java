package org.panorama.walkthrough.service.storage;

import com.qcloud.cos.COSClient;
import com.qcloud.cos.exception.CosClientException;
import com.qcloud.cos.exception.CosServiceException;
import com.qcloud.cos.model.COSObject;
import com.qcloud.cos.model.ObjectMetadata;
import com.qcloud.cos.model.PutObjectRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;

/**
 * @author WangZx
 * @version 1.0
 * @className CosStorageServiceImpl
 * @date 2025/4/9
 * @createTime 16:31
 * @Description 腾讯云oss上传工具类
 */
@Primary
@Service
@Slf4j
public class CosStorageServiceImpl implements StorageService {

    @Value("${tencent.cos.bucket}")
    private String bucketName;

    @Autowired
    private COSClient cosClient;


    @Override
    public void init() {

    }

    //图片资源存储到oss
    @Override
    public void store(MultipartFile file, String prefix, String picId) {

        String fileName = file.getOriginalFilename();
        try {
            if (file.isEmpty()) {
                throw new StorageException("Failed to storage empty file" + file.getOriginalFilename());
            }

            String suffix = fileName.substring(fileName.lastIndexOf('.'));
            String storageKey = "panoramas/" + prefix + picId + suffix;

            ObjectMetadata metadata = new ObjectMetadata();
            metadata.setContentLength(file.getSize());

            PutObjectRequest putObjectRequest = new PutObjectRequest(bucketName, storageKey, file.getInputStream(), metadata);
            cosClient.putObject(putObjectRequest);
            log.info("Pano Resources Save to COS Success:" + storageKey);
        } catch (IOException e) {
            log.error("Resources Save to Cos Failed:" + file.getOriginalFilename() + " " + e.getMessage());
            throw new StorageException("Failed to store file" + file.getOriginalFilename(), e);
        }

    }

    //全景漫游json配置文件存储到oss
    @Override
    public void store(String str, String prefix) {

        try {
            String storageKey = "panoramas/" + prefix + "projectConfig.json";
            byte[] bytes = str.getBytes(StandardCharsets.UTF_8);
            InputStream inputStream = new ByteArrayInputStream(bytes);

            ObjectMetadata metadata = new ObjectMetadata();
            metadata.setContentLength(bytes.length);
            metadata.setContentType("application/json");

            PutObjectRequest putObjectRequest = new PutObjectRequest(bucketName, storageKey, inputStream, metadata);
            cosClient.putObject(putObjectRequest);
            log.info("Config Resources Save to COS Success:" + storageKey);

        } catch (Exception e) {
            log.error("Resources Save to COS Failed:" + prefix + " configuration file " + e.getMessage());
            System.out.println(e.getMessage());
        }

    }

    //根据userid和projectId和文件名获取资源文件流
    //prefix包括包括userId和projectId
    @Override
    public InputStream getSource(String prefix, String simpleSourceName) throws Exception {
        String storageKey = "panoramas/" + prefix + simpleSourceName;
        try {
            //先检查文件是否存在
            ObjectMetadata metadata = cosClient.getObjectMetadata(bucketName, storageKey);

            COSObject cosObject = cosClient.getObject(bucketName, storageKey);
            return cosObject.getObjectContent();

        } catch (CosServiceException e) {
            throw new StorageException("COS获取资源异常" + e.getMessage(), e);
        } catch (CosClientException e) {
            throw new StorageException("COS客户端异常" + e.getMessage(), e);
        }
    }

    @Override
    public void delete(String path) {
        String storageKey = "panoramas/" + path;
        try{
            cosClient.deleteObject(bucketName, storageKey);
            log.info("Resource Deleted Success:" + path);
        }catch (CosServiceException e){
            throw new StorageException("Failed to delete object from COS(Service Exception)" + e.getMessage(), e);
        }catch (CosClientException e){
            throw new StorageException("Failed to delete object from COS(Client Exception)" + e.getMessage(), e);
        }

    }

    //读取全景漫游配置文件
    @Override
    public byte[] readJsonFile(String path) {
        String storageKey = "panoramas/" + path;
        byte[] jsonFile = new byte[]{};
        try {
            //获取对象
            COSObject cosObject = cosClient.getObject(bucketName, storageKey);
            InputStream inputStream = cosObject.getObjectContent();

            jsonFile = inputStream.readAllBytes();
        } catch (IOException e) {
            log.error("Read Configuration Json File Failed Path:" + path);
        }
        return jsonFile;
    }

    @Override
    public String getLocation() {
        return "";
    }
}
