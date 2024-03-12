package org.panorama.walkthrough.service.algorithm;

import java.io.IOException;

/**
 * @author WangZx
 * @version 1.0
 * @className ThumbGenerateService
 * @date 2024/3/12
 * @createTime 15:05
 * @Description TODO
 */
public abstract class ThumbGenerateService {

    public Boolean thumbGenerate(String imgDir, String imgName) throws IOException {

        return doThumbGenerate(imgDir,imgName);

    }

    abstract Boolean doThumbGenerate(String imageDir, String imgName);


}
