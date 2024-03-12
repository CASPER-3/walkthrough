package org.panorama.walkthrough.service.algorithm;

import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;

/**
 * @author WangZx
 * @version 1.0
 * @className DepthEstimateService
 * @date 2023/10/16
 * @createTime 15:15
 * @Description
 */
public abstract class DepthEstimateService {

    public Boolean depthEstimate(String imgDir,String imgName) throws IOException {

        return doDepthEstimate(imgDir,imgName);

    }

    abstract Boolean doDepthEstimate(String imageDir,String imgName);


}
