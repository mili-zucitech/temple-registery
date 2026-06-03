import javax.crypto.Cipher;
import javax.crypto.spec.*;
import java.util.Base64;
import java.nio.charset.*;
public class EncryptDrafts {
    static final byte[] KEY = "TempleRegDev32ByteKey!!Replace!!".getBytes(StandardCharsets.UTF_8);
    public static void main(String[] a) throws Exception {
        String[] pans  = {"AABCS1014Z","AABCS1016Z","AABCS1017Z","AABCS1018Z"};
        String[] banks = {"1014010140","1016010160","1017010170","1018010180"};
        String[] lbls  = {"T14","T16","T17","T18"};
        for(int i=0;i<pans.length;i++){
            System.out.println("PAN_"+lbls[i]+"="+enc(pans[i]));
            System.out.println("BANK_"+lbls[i]+"="+enc(banks[i]));
        }
    }
    static String enc(String pt) throws Exception {
        byte[] p=pt.getBytes(StandardCharsets.UTF_8);
        byte[] iv=new byte[12]; System.arraycopy(p,0,iv,0,Math.min(p.length,12));
        byte[] ct=new byte[p.length+16];
        Cipher c=Cipher.getInstance("AES/GCM/NoPadding");
        c.init(Cipher.ENCRYPT_MODE,new SecretKeySpec(KEY,"AES"),new GCMParameterSpec(128,iv));
        c.doFinal(p,0,p.length,ct,0);
        byte[] out=new byte[12+ct.length]; System.arraycopy(iv,0,out,0,12); System.arraycopy(ct,0,out,12,ct.length);
        return Base64.getEncoder().encodeToString(out);
    }
}