import java.io.FileOutputStream;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.PrivateKey;
import java.security.PublicKey;
import java.util.Base64;

public class KeyGenerator {
    public static void main(String[] args) throws Exception {
        Files.createDirectories(Paths.get("backend/src/main/resources/keys"));

        KeyPairGenerator kpg = KeyPairGenerator.getInstance("RSA");
        kpg.initialize(2048);
        KeyPair kp = kpg.generateKeyPair();

        PrivateKey priv = kp.getPrivate();
        PublicKey pub = kp.getPublic();

        String privPem = "-----BEGIN PRIVATE KEY-----\n" +
                         Base64.getMimeEncoder(64, new byte[]{'\n'}).encodeToString(priv.getEncoded()) +
                         "\n-----END PRIVATE KEY-----";
        Files.write(Paths.get("backend/src/main/resources/keys/jwt-private.pem"), privPem.getBytes());

        String pubPem = "-----BEGIN PUBLIC KEY-----\n" +
                        Base64.getMimeEncoder(64, new byte[]{'\n'}).encodeToString(pub.getEncoded()) +
                        "\n-----END PUBLIC KEY-----";
        Files.write(Paths.get("backend/src/main/resources/keys/jwt-public.pem"), pubPem.getBytes());

        System.out.println("Keys generated successfully in backend/src/main/resources/keys");
    }
}
