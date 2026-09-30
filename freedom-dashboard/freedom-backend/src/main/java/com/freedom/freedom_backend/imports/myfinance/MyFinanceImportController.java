package com.freedom.freedom_backend.imports.myfinance;

import com.freedom.freedom_backend.user.User;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/imports/myfinance")
public class MyFinanceImportController {
    private final MyFinanceImportService service;

    public MyFinanceImportController(MyFinanceImportService service) {
        this.service = service;
    }

    @PostMapping(value = "/preview", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public MyFinanceImportPreview preview(@RequestPart("file") MultipartFile file,
                                          @AuthenticationPrincipal User user) {
        return service.preview(file, user);
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public MyFinanceImportResult importBackup(@RequestPart("file") MultipartFile file,
                                              @AuthenticationPrincipal User user) {
        return service.importBackup(file, user);
    }
}
