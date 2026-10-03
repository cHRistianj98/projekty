package com.freedom.freedom_backend.asset;
import com.freedom.freedom_backend.user.User;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;
@Service public class SystemCashService{
 private final JdbcTemplate jdbc; public SystemCashService(JdbcTemplate jdbc){this.jdbc=jdbc;}
 public void ensureExists(User u){Long uid=u.getId();jdbc.update("INSERT INTO portfolios(user_id,name,type,color,icon_key,system_portfolio,sort_order) SELECT ?,'Główny','MAIN','#3b82f6','wallet',TRUE,0 WHERE NOT EXISTS(SELECT 1 FROM portfolios WHERE user_id=? AND type='MAIN' AND system_portfolio=TRUE)",uid,uid);jdbc.update("INSERT INTO portfolios(user_id,name,type,color,icon_key,system_portfolio,sort_order) SELECT ?,'Cele','GOALS','#8b5cf6','target',TRUE,999 WHERE NOT EXISTS(SELECT 1 FROM portfolios WHERE user_id=? AND type='GOALS' AND system_portfolio=TRUE)",uid,uid);Integer n=jdbc.queryForObject("SELECT COUNT(*) FROM assets WHERE user_id=? AND system_cash=TRUE",Integer.class,uid);if(n!=null&&n>0)return;jdbc.update("INSERT INTO assets(user_id,name,value,color,category,icon_key,system_cash,portfolio_id) SELECT ?,'Środki nierozdzielone',0,'#3b82f6','CASH','wallet',TRUE,p.id FROM portfolios p WHERE p.user_id=? AND p.type='MAIN' AND p.system_portfolio=TRUE",uid,uid);}
 public void applyDelta(User u,BigDecimal d){ensureExists(u);int n=jdbc.update("UPDATE assets SET value=value+? WHERE user_id=? AND system_cash=TRUE AND value+?>=0",d,u.getId(),d);if(n==0)throw new IllegalArgumentException("Operacja spowodowałaby ujemne saldo Środków nierozdzielonych.");}
}
