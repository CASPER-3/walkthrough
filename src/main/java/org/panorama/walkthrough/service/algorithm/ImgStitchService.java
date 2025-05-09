package org.panorama.walkthrough.service.algorithm;

/**
 * @author yang
 * @version 1.0.0
 * @ClassName imgStitchService.java
 * @Description TODO
 * @createTime 2023/03/20
 */
public abstract class ImgStitchService {
    /**
     * @title stitch
     * @description stitch images
     * @param images_dir images' absolute path
     */
    public Boolean stitch(String images_dir){
        if(doStich(images_dir)
                &&prepare(images_dir)
                    &&after(images_dir)){
            return true;
        }else{
            return false;
        }
    }
    abstract Boolean doStich(String images_dir);
    abstract Boolean prepare(String images_dir);
    abstract Boolean after(String images_dir);
    public abstract Boolean cleanUp(String images_dir);
}
