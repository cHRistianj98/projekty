package com.freedom.freedom_backend.liability;

import com.freedom.freedom_backend.user.User;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@Transactional
public class LiabilityService {

    private final LiabilityRepository liabilityRepository;
    private final JdbcTemplate jdbc;

    public LiabilityService(LiabilityRepository liabilityRepository, JdbcTemplate jdbc) {
        this.liabilityRepository = liabilityRepository;
        this.jdbc = jdbc;
    }

    @Transactional(readOnly = true)
    public List<LiabilityResponse> getAllLiabilities(User currentUser) {
        return liabilityRepository.findAllByUserId(currentUser.getId())
                .stream().map(LiabilityResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public LiabilityResponse getLiability(Long id, User currentUser) {
        return LiabilityResponse.from(findLiability(id, currentUser));
    }

    public LiabilityResponse createLiability(LiabilityRequest request, User currentUser) {
        validate(request);
        Liability liability = new Liability(
                currentUser,
                request.name(), request.type(), request.originalAmount(),
                request.remainingAmount(), request.monthlyPayment(),
                request.principalPayment(), request.interestPayment(),
                request.interestRate(), request.imageUrl(),
                request.imagePosition(), request.iconKey()
        );
        return LiabilityResponse.from(liabilityRepository.save(liability));
    }

    public LiabilityResponse updateLiability(Long id, LiabilityRequest request, User currentUser) {
        validate(request);
        Liability liability = findLiability(id, currentUser);
        liability.update(
                request.name(), request.type(), request.originalAmount(),
                request.remainingAmount(), request.monthlyPayment(),
                request.principalPayment(), request.interestPayment(),
                request.interestRate(), request.imageUrl(),
                request.imagePosition(), request.iconKey()
        );
        clampAllocationsToRemaining(liability.getId(), currentUser.getId(), request.remainingAmount());
        return LiabilityResponse.from(liability);
    }

    public void deleteLiability(Long id, User currentUser) {
        liabilityRepository.delete(findLiability(id, currentUser));
    }

    private void validate(LiabilityRequest request) {
        if (request.remainingAmount().compareTo(request.originalAmount()) > 0) {
            throw new IllegalArgumentException("Remaining amount cannot exceed original amount");
        }
        if (request.principalPayment().compareTo(request.monthlyPayment()) > 0) {
            throw new IllegalArgumentException("Principal payment cannot exceed monthly payment");
        }
    }

    private void clampAllocationsToRemaining(Long liabilityId, Long userId, BigDecimal remainingAmount) {
        BigDecimal allocated = jdbc.queryForObject(
                "SELECT COALESCE(SUM(amount),0) FROM liability_allocations WHERE user_id=? AND liability_id=?",
                BigDecimal.class, userId, liabilityId
        );
        BigDecimal overflow = (allocated == null ? BigDecimal.ZERO : allocated).subtract(remainingAmount);
        if (overflow.signum() <= 0) return;

        List<AllocationRow> rows = jdbc.query(
                "SELECT id,amount FROM liability_allocations WHERE user_id=? AND liability_id=? ORDER BY updated_at DESC,id DESC",
                (rs, rowNum) -> new AllocationRow(rs.getLong("id"), rs.getBigDecimal("amount")),
                userId, liabilityId
        );
        for (AllocationRow row : rows) {
            if (overflow.signum() == 0) break;
            BigDecimal cut = row.amount().min(overflow);
            jdbc.update("UPDATE liability_allocations SET amount=amount-?,updated_at=NOW() WHERE id=?", cut, row.id());
            jdbc.update("DELETE FROM liability_allocations WHERE id=? AND amount=0", row.id());
            overflow = overflow.subtract(cut);
        }
    }

    private record AllocationRow(Long id, BigDecimal amount) {}

    private Liability findLiability(Long id, User currentUser) {
        return liabilityRepository.findByIdAndUserId(id, currentUser.getId())
                .orElseThrow(() -> new LiabilityNotFoundException(id));
    }
}
