import java.sql.*;
public class VerifySeed2 {
    public static void main(String[] a) throws Exception {
        String url = "jdbc:mysql://gateway01.ap-southeast-1.prod.aws.tidbcloud.com:4000/test?useSSL=true&allowPublicKeyRetrieval=true&serverTimezone=UTC";
        try (Connection cn = DriverManager.getConnection(url,"3Nkwm2fKtuGqoiu.root","6sXYNlDhrX80xnDz")) {
            run(cn,"SELECT id, trust_name, trust_registration_number, status FROM trusts WHERE id BETWEEN 116 AND 119 ORDER BY id");
            run(cn,"SELECT COUNT(*) n FROM employees WHERE id BETWEEN 300 AND 349");
            run(cn,"SELECT COUNT(*) n FROM contractors WHERE id BETWEEN 300 AND 324");
            run(cn,"SELECT id, temple_id, status, version FROM temple_profile_staging WHERE id BETWEEN 114 AND 121 ORDER BY id");
            run(cn,"SELECT id, temple_id, status FROM asset_declarations WHERE id BETWEEN 119 AND 120 ORDER BY id");
        }
    }
    static void run(Connection cn, String q) throws Exception {
        System.out.println("--- "+q.substring(0,50)+"...");
        ResultSet rs = cn.createStatement().executeQuery(q);
        ResultSetMetaData md = rs.getMetaData();
        while(rs.next()){
            StringBuilder sb = new StringBuilder();
            for(int i=1;i<=md.getColumnCount();i++) sb.append(md.getColumnName(i)+"="+rs.getString(i)+" ");
            System.out.println(" "+sb);
        }
    }
}