package com.senai.demo.controller;

import java.util.Map;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.senai.demo.dto.plan.ActionPlanRequest;
import com.senai.demo.dto.plan.ActionPlanResponse;
import com.senai.demo.security.CustomUserPrincipal;
import com.senai.demo.service.ActionPlanService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/action-plans")
public class ActionPlanController {

    private final ActionPlanService actionPlanService;

    public ActionPlanController(ActionPlanService actionPlanService) {
        this.actionPlanService = actionPlanService;
    }

    @GetMapping
    public ResponseEntity<Page<ActionPlanResponse>> getAllActionPlans(
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        
        Pageable pageable = PageRequest.of(page, size);
        Page<ActionPlanResponse> plans = actionPlanService.findAll(status, pageable);
        return ResponseEntity.ok(plans);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ActionPlanResponse> getActionPlanById(@PathVariable UUID id) {
        ActionPlanResponse plan = actionPlanService.findById(id);
        return ResponseEntity.ok(plan);
    }

    @PostMapping
    public ResponseEntity<ActionPlanResponse> createActionPlan(@Valid @RequestBody ActionPlanRequest request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        CustomUserPrincipal principal = (CustomUserPrincipal) authentication.getPrincipal();
        UUID createdBy = principal.getProfile().getId();

        ActionPlanResponse plan = actionPlanService.create(createdBy, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(plan);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ActionPlanResponse> updateActionPlan(
            @PathVariable UUID id,
            @Valid @RequestBody ActionPlanRequest request) {
        
        ActionPlanResponse plan = actionPlanService.update(id, request);
        return ResponseEntity.ok(plan);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteActionPlan(@PathVariable UUID id) {
        actionPlanService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Long>> getStats() {
        Map<String, Long> stats = actionPlanService.getStats();
        return ResponseEntity.ok(stats);
    }
}
