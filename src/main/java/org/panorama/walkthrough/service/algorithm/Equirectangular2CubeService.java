package org.panorama.walkthrough.service.algorithm;

import java.io.IOException;

/**
 * @author WangZx
 * @version 1.0
 * @className Equirectangular2CubeService
 * @date 2024/3/19
 * @createTime 10:24
 * @Description TODO
 */
public abstract class Equirectangular2CubeService {

    public Boolean equirectangular2Cube(String imgDir,String imgName) throws IOException{

        return doEquirectangular2Cube(imgDir,imgName);

    }

    abstract Boolean doEquirectangular2Cube(String imgDir,String imgName);


}
