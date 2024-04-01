package org.panorama.walkthrough.service.algorithm;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;

/**
 * @author WangZx
 * @version 1.0
 * @className Equirectangular2CubeServiceImpl
 * @date 2024/3/19
 * @createTime 14:12
 * @Description TODO
 */

@Service("Equirectangular2CubeService")
public class Equirectangular2CubeServiceImpl extends Equirectangular2CubeService{

    @Value("${customer.projectResourcesLocation}")
    private String PROJECT_RESOURCES_LOCATION;
    @Override
    Boolean doEquirectangular2Cube(String imgDir, String imgName) {

        String command = getCommand(imgDir, imgName);


        try {
            Process process = Runtime.getRuntime().exec(command);

            StringBuilder sb = new StringBuilder();
            BufferedReader br = new BufferedReader(new InputStreamReader(process.getInputStream()));
            String read;

            while ((read = br.readLine()) != null) {
                sb.append(read);
            }

            br.close();
            System.out.println(sb.toString());
            return true;

        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }

    private String getCommand(String imageDir, String imageName) {
        String pathPrefix = "../../../../../../userData/projectResources/";
        String command = "powershell cd src/main/resources/static/python/py360convert ;  D:\\anaconda3\\shell\\condabin\\conda-hook.ps1 ; conda activate py360convert;python convert360.py --convert e2c --i ";
        String saveDir = pathPrefix + imageDir;
        String fullImageDir = saveDir + imageName;
        String outputDir = saveDir;
        command += fullImageDir + " --o " + outputDir + " --w 1024";
        return command;
    }
}
