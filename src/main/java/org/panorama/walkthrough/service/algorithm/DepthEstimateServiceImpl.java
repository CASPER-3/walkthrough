package org.panorama.walkthrough.service.algorithm;

import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;

/**
 * @author WangZx
 * @version 1.0
 * @className DepthEstimateServiceImpl
 * @date 2023/10/16
 * @createTime 15:23
 * @Description TODO
 */

@Service("DepthEstimateService")
public class DepthEstimateServiceImpl extends DepthEstimateService {

    @Override
    Boolean doDepthEstimate(String imageDir,String imageName) {

        String command = getCommand(imageDir, imageName);
        String layoutCommand = getLayoutCommand(imageDir,imageName);


        try {
            Process process = Runtime.getRuntime().exec(command);
            Process layoutProcess = Runtime.getRuntime().exec(layoutCommand);

            StringBuilder sb = new StringBuilder();
            BufferedReader br = new BufferedReader(new InputStreamReader(process.getInputStream()));
            String read;

            StringBuilder sb_layout = new StringBuilder();
            BufferedReader br_layout = new BufferedReader(new InputStreamReader(layoutProcess.getInputStream()));
            String read_layout;


            while ((read = br.readLine()) != null) {
                sb.append(read);

            }

            while((read_layout=br_layout.readLine())!=null){
                sb_layout.append(read_layout);
            }

            br.close();
            br_layout.close();
            System.out.println(sb.toString());
            System.out.println(sb_layout.toString());
            return true;

        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }

    private static String getCommand(String imageDir, String imageName) {
        String pathPrefix = "../../../../../../userData/projectResources/";
        String command = "powershell cd src/main/resources/static/python/HoHoNet ;  D:\\anaconda3\\shell\\condabin\\conda-hook.ps1 ; conda activate pytorch;python infer_depth.py --cfg config/mp3d_depth/HOHO_depth_dct_efficienthc_TransEn1_hardnet.yaml --pth ckpt/mp3d_depth_HOHO_depth_dct_efficienthc_TransEn1_hardnet/ep60.pth --out";
        String saveDir = pathPrefix+ imageDir;
        String fullImageDir = saveDir+ imageName;
        command+=" "+saveDir+" --inp "+fullImageDir;
        return command;
    }

    private static String getLayoutCommand(String imageDir,String imageName){

        String pathPrefix = "../../../../../../userData/projectResources/";
        String command = "powershell cd src/main/resources/static/python/HoHoNet ;  D:\\anaconda3\\shell\\condabin\\conda-hook.ps1 ; conda activate pytorch;python infer_depth_layout.py  --out";
        String saveDir = pathPrefix+ imageDir;
        String fullImageDir = saveDir+ imageName;
        command+=" "+saveDir+" --inp "+fullImageDir;
        return command;

    }
}
