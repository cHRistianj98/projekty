package com.freedom.freedom_backend.asset;
import com.freedom.freedom_backend.user.User;
import com.freedom.freedom_backend.ledger.MoneyLedgerService;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.util.*;
@Service @Transactional
public class AssetService{
 private static final Set<String> ICONS=Set.of("landmark","wallet","banknote","coins","trendingUp","chart","bitcoin","circleDollar","building","house","briefcase","car","shield","piggyBank","gem","vault");
 private final AssetRepository repo; private final JdbcTemplate jdbc; private final MoneyLedgerService ledger;
 public AssetService(AssetRepository repo,JdbcTemplate jdbc,MoneyLedgerService ledger){this.repo=repo;this.jdbc=jdbc;this.ledger=ledger;}
 @Transactional(readOnly=true) public List<AssetResponse> getAllAssets(User u){return repo.findAllByUserId(u.getId()).stream().map(AssetResponse::from).toList();}
 @Transactional(readOnly=true) public AssetResponse getAsset(Long id,User u){return AssetResponse.from(find(id,u));}
 public AssetResponse createAsset(AssetRequest r,User u){AssetCategory c=r.category()!=null?r.category():AssetCategory.OTHER;Long pid=resolvePortfolio(r.portfolioId(),u.getId());Asset a=new Asset(u,r.name(),r.value(),r.color(),c,icon(r.iconKey(),c),pid);Asset saved=repo.saveAndFlush(a);ledger.recordAssetCreation(saved.getId(),saved.getValue(),u);return AssetResponse.from(saved);}
 public AssetResponse updateAsset(Long id,AssetRequest r,User u){Asset a=find(id,u); AssetCategory c=r.category()!=null?r.category():AssetCategory.OTHER; Long pid=a.isSystemCash()?a.getPortfolioId():resolvePortfolio(r.portfolioId()!=null?r.portfolioId():a.getPortfolioId(),u.getId()); if(a.isSystemCash()&&r.value().compareTo(a.getValue())!=0)throw new IllegalArgumentException("Systemowa Gotówka jest sterowana przez przychody i wydatki."); BigDecimal before=a.getValue(); if(!a.isSystemCash()&&r.value().compareTo(before)<0&&r.value().compareTo(ledger.reserved(id,u))<0)throw new IllegalArgumentException("Nie można obniżyć wartości aktywa poniżej kwoty zarezerwowanej na cele i zobowiązania. Najpierw zwolnij część rezerwacji."); String oldName=a.getName(); a.update(r.name(),r.value(),r.color(),c,icon(r.iconKey(),c),pid); if(!a.isSystemCash()&&before.compareTo(r.value())!=0){jdbc.update("INSERT INTO asset_valuation_events(user_id,asset_id,asset_name_snapshot,previous_value,new_value,delta,reason) VALUES(?,?,?,?,?,?,'MARKET_REVALUATION')",u.getId(),a.getId(),oldName,before,r.value(),r.value().subtract(before));ledger.recordValuation(a.getId(),before,r.value(),u);} return AssetResponse.from(a);}
 public void deleteAsset(Long id,User u){Asset a=find(id,u);if(a.isSystemCash())throw new IllegalArgumentException("Systemowej Gotówki nie można usunąć.");if(ledger.reserved(id,u).signum()>0)throw new IllegalArgumentException("Najpierw zwolnij środki tego aktywa z celów i zobowiązań.");ledger.consumeAssetBeforeDelete(id,u);repo.delete(a);}
 private Asset find(Long id,User u){return repo.findByIdAndUserId(id,u.getId()).orElseThrow(()->new AssetNotFoundException(id));}
 private Long resolvePortfolio(Long requested,Long uid){if(requested!=null){Integer n=jdbc.queryForObject("SELECT COUNT(*) FROM portfolios WHERE id=? AND user_id=? AND type<>'GOALS'",Integer.class,requested,uid);if(n!=null&&n>0)return requested;}return jdbc.queryForObject("SELECT id FROM portfolios WHERE user_id=? AND type='MAIN' AND system_portfolio=TRUE",Long.class,uid);}
 private String icon(String k,AssetCategory c){if(k!=null&&ICONS.contains(k))return k;return switch(c){case CASH->"landmark";case STOCKS->"chart";case CRYPTO->"bitcoin";case REAL_ESTATE->"building";case BUSINESS->"briefcase";case VEHICLE->"car";case OTHER->"circleDollar";};}
}
