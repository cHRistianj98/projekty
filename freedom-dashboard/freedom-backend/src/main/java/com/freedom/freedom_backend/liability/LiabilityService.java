package com.freedom.freedom_backend.liability;

import com.freedom.freedom_backend.user.User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class LiabilityService {

    private final LiabilityRepository liabilityRepository;

    public LiabilityService(
            LiabilityRepository liabilityRepository
    ) {
        this.liabilityRepository =
                liabilityRepository;
    }

    @Transactional(readOnly = true)
    public List<LiabilityResponse> getAllLiabilities(
            User currentUser
    ) {
        return liabilityRepository
                .findAllByUserId(
                        currentUser.getId()
                )
                .stream()
                .map(LiabilityResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public LiabilityResponse getLiability(
            Long id,
            User currentUser
    ) {
        return LiabilityResponse.from(
                findLiability(
                        id,
                        currentUser
                )
        );
    }

    public LiabilityResponse createLiability(
            LiabilityRequest request,
            User currentUser
    ) {
        Liability liability =
                new Liability(
                        currentUser,
                        request.name(),
                        request.type(),
                        request.originalAmount(),
                        request.remainingAmount(),
                        request.monthlyPayment(),
                        request.principalPayment(),
                        request.interestPayment(),
                        request.interestRate()
                );

        Liability savedLiability =
                liabilityRepository.save(
                        liability
                );

        return LiabilityResponse.from(
                savedLiability
        );
    }

    public LiabilityResponse updateLiability(
            Long id,
            LiabilityRequest request,
            User currentUser
    ) {
        Liability liability =
                findLiability(
                        id,
                        currentUser
                );

        liability.update(
                request.name(),
                request.type(),
                request.originalAmount(),
                request.remainingAmount(),
                request.monthlyPayment(),
                request.principalPayment(),
                request.interestPayment(),
                request.interestRate()
        );

        return LiabilityResponse.from(
                liability
        );
    }

    public void deleteLiability(
            Long id,
            User currentUser
    ) {
        Liability liability =
                findLiability(
                        id,
                        currentUser
                );

        liabilityRepository.delete(
                liability
        );
    }

    private Liability findLiability(
            Long id,
            User currentUser
    ) {
        return liabilityRepository
                .findByIdAndUserId(
                        id,
                        currentUser.getId()
                )
                .orElseThrow(
                        () ->
                                new LiabilityNotFoundException(
                                        id
                                )
                );
    }
}