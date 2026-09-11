package com.senai.demo.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.senai.demo.dto.plan.PlanAssignmentRequest;
import com.senai.demo.entity.ActionPlan;
import com.senai.demo.entity.PlanAssignment;
import com.senai.demo.entity.Profile;
import com.senai.demo.exception.ResourceNotFoundException;
import com.senai.demo.exception.ValidationException;
import com.senai.demo.repository.ActionPlanRepository;
import com.senai.demo.repository.PlanAssignmentRepository;
import com.senai.demo.repository.ProfileRepository;

@Service
@Transactional
public class PlanAssignmentService {

    private final PlanAssignmentRepository planAssignmentRepository;

    private final ActionPlanRepository actionPlanRepository;

    private final ProfileRepository profileRepository;

    public PlanAssignmentService(PlanAssignmentRepository planAssignmentRepository,
                                 ActionPlanRepository actionPlanRepository,
                                 ProfileRepository profileRepository) {
        this.planAssignmentRepository = planAssignmentRepository;
        this.actionPlanRepository = actionPlanRepository;
        this.profileRepository = profileRepository;
    }

    public List<String> findProfessorsByPlan(UUID planId) {
        List<PlanAssignment> assignments = planAssignmentRepository.findByPlanId(planId);
        return assignments.stream()
            .map(a -> a.getProfessor().getFullName())
            .collect(Collectors.toList());
    }

    public void assignProfessor(PlanAssignmentRequest request) {
        ActionPlan plan = actionPlanRepository.findById(request.getPlanId())
            .orElseThrow(() -> new ResourceNotFoundException("Plano de ação não encontrado"));

        Profile professor = profileRepository.findById(request.getProfessorId())
            .orElseThrow(() -> new ResourceNotFoundException("Professor não encontrado"));

        if (!professor.getRole().equals(Profile.Role.PROFESSOR) && !professor.getRole().equals(Profile.Role.MANAGER)) {
            throw new ValidationException("Usuário não é professor ou gerenciador");
        }

        PlanAssignment assignment = new PlanAssignment();
        assignment.setPlan(plan);
        assignment.setProfessor(professor);

        planAssignmentRepository.save(assignment);
    }

    public void removeAssignment(UUID assignmentId) {
        PlanAssignment assignment = planAssignmentRepository.findById(assignmentId)
            .orElseThrow(() -> new ResourceNotFoundException("Atribuição não encontrada"));

        assignment.setDeletedAt(LocalDateTime.now());
        planAssignmentRepository.save(assignment);
    }
}
