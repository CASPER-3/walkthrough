package org.panorama.walkthrough.service.algorithm;

import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;

/**
 * @author WangZx
 * @version 1.0
 * @className ThumbGenerateServiceImpl
 * @date 2024/3/12
 * @createTime 15:09
 * @Description TODO
 */

@Service("ThumbGenerateService")
public class ThumbGenerateServiceImpl extends ThumbGenerateService {


    @Override
    Boolean doThumbGenerate(String imageDir, String imgName) {
        String command = getCommand(imageDir, imgName);


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

    private static String getCommand(String imageDir, String imageName) {
        String pathPrefix = "../../../../../userData/projectResources/";
        String command = "powershell cd src/main/resources/static/python ;  D:\\anaconda3\\shell\\condabin\\conda-hook.ps1 ; conda activate py360convert;python convert360.py --convert e2p --i ";
        String saveDir = pathPrefix + imageDir;
        String fullImageDir = saveDir + imageName;
        String outputDir = saveDir + "thumb.jpg";
        command += fullImageDir + " --o " + outputDir + " --w 1024 --h 1024 --u_deg 0 --v_deg 0";
        return command;
    }
}
