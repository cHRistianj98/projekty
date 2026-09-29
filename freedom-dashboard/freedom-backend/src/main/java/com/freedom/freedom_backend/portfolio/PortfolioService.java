package com.freedom.freedom_backend.portfolio;

import com.freedom.freedom_backend.user.User;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.util.List;

@Service @Transactional
public class PortfolioService {
    private final JdbcTemplate jdbc;
    public PortfolioService(JdbcTemplate jdbc){this.jdbc=jdbc;}

    @Transactional(readOnly=true)
    public List<PortfolioResponse> getAll(User user){
        return jdbc.query("""
          SELECT p.id,p.name,p.type,p.color,p.icon_key,p.system_portfolio,
                 CASE WHEN p.type='GOALS' THEN 0 ELSE COALESCE(SUM(a.value),0) END gross_value,
                 CASE WHEN p.type='GOALS' THEN 0 ELSE COALESCE((SELECT SUM(ga.amount) FROM goal_allocations ga JOIN assets aa ON aa.id=ga.asset_id WHERE aa.portfolio_id=p.id AND ga.user_id=p.user_id),0) END allocated_out,
                 CASE WHEN p.type='GOALS'
                      THEN COALESCE((SELECT SUM(ga.amount) FROM goal_allocations ga WHERE ga.user_id=p.user_id),0)
                      ELSE COALESCE(SUM(a.value),0)-COALESCE((SELECT SUM(ga.amount) FROM goal_allocations ga JOIN assets aa ON aa.id=ga.asset_id WHERE aa.portfolio_id=p.id AND ga.user_id=p.user_id),0)
                 END display_value
          FROM portfolios p LEFT JOIN assets a ON a.portfolio_id=p.id
          WHERE p.user_id=? GROUP BY p.id ORDER BY p.sort_order,p.id
        """,(rs,n)->new PortfolioResponse(rs.getLong("id"),rs.getString("name"),PortfolioType.valueOf(rs.getString("type")),rs.getString("color"),rs.getString("icon_key"),rs.getBoolean("system_portfolio"),rs.getBigDecimal("gross_value"),rs.getBigDecimal("allocated_out"),rs.getBigDecimal("display_value")),user.getId());
    }

    public PortfolioResponse create(PortfolioRequest r,User user){
        ensureSystemPortfolios(user.getId());
        Long id=jdbc.queryForObject("INSERT INTO portfolios(user_id,name,type,color,icon_key,system_portfolio,sort_order) VALUES(?,?,'CUSTOM',?,?,FALSE,100) RETURNING id",Long.class,user.getId(),r.name().trim(),color(r.color()),icon(r.iconKey()));
        return getAll(user).stream().filter(x->x.id().equals(id)).findFirst().orElseThrow();
    }

    public PortfolioResponse update(Long id,PortfolioRequest r,User user){
        Integer sys=jdbc.queryForObject("SELECT COUNT(*) FROM portfolios WHERE id=? AND user_id=? AND system_portfolio=TRUE",Integer.class,id,user.getId());
        if(sys!=null&&sys>0) throw new IllegalArgumentException("Portfela systemowego nie można edytować.");
        int n=jdbc.update("UPDATE portfolios SET name=?,color=?,icon_key=? WHERE id=? AND user_id=?",r.name().trim(),color(r.color()),icon(r.iconKey()),id,user.getId());
        if(n==0) throw new IllegalArgumentException("Nie znaleziono portfela.");
        return getAll(user).stream().filter(x->x.id().equals(id)).findFirst().orElseThrow();
    }

    public void delete(Long id,User user){
        Integer sys=jdbc.queryForObject("SELECT COUNT(*) FROM portfolios WHERE id=? AND user_id=? AND system_portfolio=TRUE",Integer.class,id,user.getId());
        if(sys!=null&&sys>0) throw new IllegalArgumentException("Portfela systemowego nie można usunąć.");
        Integer assets=jdbc.queryForObject("SELECT COUNT(*) FROM assets WHERE portfolio_id=? AND user_id=?",Integer.class,id,user.getId());
        if(assets!=null&&assets>0) throw new IllegalArgumentException("Najpierw przenieś lub usuń aktywa z portfela.");
        jdbc.update("DELETE FROM portfolios WHERE id=? AND user_id=?",id,user.getId());
    }

    public void transfer(PortfolioTransferRequest r,User user){
        if(r.sourceAssetId().equals(r.targetAssetId())) throw new IllegalArgumentException("Źródło i cel muszą być różne.");
        AssetRow s=asset(r.sourceAssetId(),user.getId()); AssetRow t=asset(r.targetAssetId(),user.getId());
        BigDecimal allocated=jdbc.queryForObject("SELECT COALESCE(SUM(amount),0) FROM goal_allocations WHERE user_id=? AND asset_id=?",BigDecimal.class,user.getId(),s.id());
        BigDecimal available=s.value().subtract(allocated==null?BigDecimal.ZERO:allocated);
        if(r.amount().compareTo(available)>0) throw new IllegalArgumentException("Za mało wolnych środków w aktywie źródłowym.");
        jdbc.update("UPDATE assets SET value=value-? WHERE id=? AND user_id=?",r.amount(),s.id(),user.getId());
        jdbc.update("UPDATE assets SET value=value+? WHERE id=? AND user_id=?",r.amount(),t.id(),user.getId());
        jdbc.update("INSERT INTO portfolio_transfers(user_id,source_asset_id,target_asset_id,source_name_snapshot,target_name_snapshot,amount) VALUES(?,?,?,?,?,?)",user.getId(),s.id(),t.id(),s.name(),t.name(),r.amount());
    }

    @Transactional(readOnly=true)
    public List<ValuationEventResponse> valuations(User user){
        return jdbc.query("SELECT id,asset_id,asset_name_snapshot,previous_value,new_value,delta,reason,created_at FROM asset_valuation_events WHERE user_id=? ORDER BY created_at DESC,id DESC LIMIT 100",(rs,n)->new ValuationEventResponse(rs.getLong("id"),(Long)rs.getObject("asset_id"),rs.getString("asset_name_snapshot"),rs.getBigDecimal("previous_value"),rs.getBigDecimal("new_value"),rs.getBigDecimal("delta"),rs.getString("reason"),rs.getTimestamp("created_at").toInstant()),user.getId());
    }

    public void ensureSystemPortfolios(Long uid){
        jdbc.update("INSERT INTO portfolios(user_id,name,type,color,icon_key,system_portfolio,sort_order) SELECT ?,'Główny','MAIN','#3b82f6','wallet',TRUE,0 WHERE NOT EXISTS(SELECT 1 FROM portfolios WHERE user_id=? AND type='MAIN' AND system_portfolio=TRUE)",uid,uid);
        jdbc.update("INSERT INTO portfolios(user_id,name,type,color,icon_key,system_portfolio,sort_order) SELECT ?,'Cele','GOALS','#8b5cf6','target',TRUE,999 WHERE NOT EXISTS(SELECT 1 FROM portfolios WHERE user_id=? AND type='GOALS' AND system_portfolio=TRUE)",uid,uid);
    }
    private AssetRow asset(Long id,Long uid){return jdbc.query("SELECT id,name,value FROM assets WHERE id=? AND user_id=?",rs->{if(!rs.next())throw new IllegalArgumentException("Nie znaleziono aktywa.");return new AssetRow(rs.getLong(1),rs.getString(2),rs.getBigDecimal(3));},id,uid);}
    private String color(String x){return x==null||x.isBlank()?"#3b82f6":x;}
    private String icon(String x){return x==null||x.isBlank()?"wallet":x;}
    private record AssetRow(Long id,String name,BigDecimal value){}
}
