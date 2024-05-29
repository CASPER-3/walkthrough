package org.panorama.walkthrough.service.algorithm;

import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.util.List;

/**
 * @author WangZx
 * @version 1.0
 * @className Dust3rServiceImpl
 * @date 2024/5/20
 * @createTime 16:38
 * @Description TODO
 */
@Service("Dust3rService")
public class Dust3rServiceImpl extends Dust3rService {

    @Override
    Boolean doDust3r(String rootDir) {

        String command = getCommand(rootDir);
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

    private static String getCommand(String rootDir) {
        String pathPrefix = "../../../../../../userData/projectResources/";
        String command = "powershell cd src/main/resources/static/python/dust3r ;  D:\\anaconda3\\shell\\condabin\\conda-hook.ps1 ; conda activate dust3r;python dust3r.py --root_dir ";
        String inputDir = pathPrefix + rootDir + "dust3rInput/";
        command += inputDir + " --scale 10 --face_index B";
        return command;
    }
}
