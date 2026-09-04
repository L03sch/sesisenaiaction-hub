package com.senai.demo.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.senai.demo.dto.plan.PlanAssignmentRequest;
import com.senai.demo.service.PlanAssignmentService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/assignments")
public class AssignmentController {

    private final PlanAssignmentService planAssignmentService;

    public AssignmentController(PlanAssignmentService planAssignmentService) {
        this.planAssignmentService = planAssignmentService;
    }

    @GetMapping
    public ResponseEntity<List<String>> getProfessorsByPlan(@RequestParam UUID planId) {
        List<String> professors = planAssignmentService.findProfessorsByPlan(planId);
        return ResponseEntity.ok(professors);
    }

    @PostMapping
    public ResponseEntity<Void> assignProfessor(@Valid @RequestBody PlanAssignmentRequest request) {
        planAssignmentService.assignProfessor(request);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> removeAssignment(@PathVariable UUID id) {
        planAssignmentService.removeAssignment(id);
        return ResponseEntity.noContent().build();
    }
}
