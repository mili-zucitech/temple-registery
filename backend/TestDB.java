import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.ResultSetMetaData;
import java.sql.Statement;

public class TestDB {
    public static void main(String[] args) {
        try {
            Connection conn = DriverManager.getConnection("jdbc:mysql://gateway01.ap-southeast-1.prod.aws.tidbcloud.com:4000/test?useSSL=true&serverTimezone=UTC&allowPublicKeyRetrieval=true", "3Nkwm2fKtuGqoiu.root", "6sXYNlDhrX80xnDz");
            Statement stmt = conn.createStatement();
            ResultSet rs = stmt.executeQuery("SELECT * FROM board_members LIMIT 1");
            ResultSetMetaData rsmd = rs.getMetaData();
            int columnCount = rsmd.getColumnCount();
            for (int i = 1; i <= columnCount; i++) {
                System.out.println(rsmd.getColumnName(i) + " - " + rsmd.getColumnTypeName(i));
            }
            System.out.println("--- TRUSTS ---");
            ResultSet rs2 = stmt.executeQuery("SELECT * FROM trusts LIMIT 1");
            ResultSetMetaData rsmd2 = rs2.getMetaData();
            int columnCount2 = rsmd2.getColumnCount();
            for (int i = 1; i <= columnCount2; i++) {
                System.out.println(rsmd2.getColumnName(i) + " - " + rsmd2.getColumnTypeName(i));
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
