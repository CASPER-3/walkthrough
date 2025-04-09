package org.panorama.walkthrough.service.storage;

import com.qcloud.cos.COSClient;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;

/**
 * @author WangZx
 * @version 1.0
 * @className CosStorageServiceImpl
 * @date 2025/4/9
 * @createTime 16:31
 * @Description 腾讯云oss上传工具类
 */
@Service
public class CosStorageServiceImpl implements StorageService {

    @Value("${tencent.cos.bucket}")
    private String bucketName;

    @Autowired
    private COSClient cosClient;


    @Override
    public void init() {

    }

    @Override
    public void store(MultipartFile file, String prefix, String picId) {

    }

    @Override
    public void store(String str, String prefix) {

    }

    @Override
    public InputStream getSource(String prefix, String simpleSourceName) throws Exception {
        return null;
    }

    @Override
    public void delete(String path) {

    }

    @Override
    public byte[] readJsonFile(String path) {
        return new byte[0];
    }

    @Override
    public String getLocation() {
        return "";
    }
}
