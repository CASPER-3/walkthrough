package org.panorama.walkthrough.service.algorithm;

import java.util.List;

/**
 * @author WangZx
 * @version 1.0
 * @className Dust3rService
 * @date 2024/4/1
 * @createTime 17:04
 * @Description TODO
 */
public abstract class Dust3rService {


    public Boolean dust3r(String rootDir){

        return doDust3r(rootDir);

    }

    abstract Boolean doDust3r(String rootDir);

}
