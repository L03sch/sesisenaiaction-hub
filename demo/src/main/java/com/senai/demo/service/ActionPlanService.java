package com.senai.demo.service;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.senai.demo.dto.plan.ActionPlanRequest;
import com.senai.demo.dto.plan.ActionPlanResponse;
import com.senai.demo.entity.ActionPlan;
import com.senai.demo.entity.ActionPlan.Priority;
import com.senai.demo.entity.ActionPlan.Status;
import com.senai.demo.entity.Profile;
import com.senai.demo.exception.ResourceNotFoundException;
import com.senai.demo.exception.ValidationException;
import com.senai.demo.repository.ActionPlanRepository;
import com.senai.demo.repository.PlanAssignmentRepository;
import com.senai.demo.repository.ProfileRepository;

@Service
@Transactional
public class ActionPlanService {

    private final ActionPlanRepository actionPlanRepository;

    private final PlanAssignmentRepository planAssignmentRepository;

    private final ProfileRepository profileRepository;

    public ActionPlanService(ActionPlanRepository actionPlanRepository,
                             PlanAssignmentRepository planAssignmentRepository,
                             ProfileRepository profileRepository) {
        this.actionPlanRepository = actionPlanRepository;
        this.planAssignmentRepository = planAssignmentRepository;
        this.profileRepository = profileRepository;
    }

    public Page<ActionPlanResponse> findAll(String status, Pageable pageable) {
        Page<ActionPlan> plans;

        if (status != null && !status.isEmpty()) {
            plans = actionPlanRepository.findByStatus(Status.valueOf(status.toUpperCase()), pageable);
        } else {
            plans = actionPlanRepository.findAll(pageable);
        }

        return plans.map(this::convertToResponse);
    }

    public ActionPlanResponse findById(UUID id) {
        ActionPlan plan = actionPlanRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Plano de ação não encontrado"));

        return convertToResponse(plan);
    }

    public ActionPlanResponse create(UUID createdBy, ActionPlanRequest request) {
        Profile profile = profileRepository.findById(createdBy)
            .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado"));

        if (request.getEndDate().isBefore(request.getStartDate())) {
            throw new ValidationException("Data de fim não pode ser anterior à data de início");
        }

        ActionPlan plan = new ActionPlan();
        plan.setTitle(request.getTitle());
        plan.setDescription(request.getDescription());
        plan.setObjective(request.getObjective());
        plan.setStatus(request.getStatus() != null ? request.getStatus() : Status.PLANNING);
        plan.setPriority(request.getPriority() != null ? request.getPriority() : Priority.MEDIUM);
        plan.setStartDate(request.getStartDate());
        plan.setEndDate(request.getEndDate());
        plan.setCreatedBy(profile);

        plan = actionPlanRepository.save(plan);
        return convertToResponse(plan);
    }

    public ActionPlanResponse update(UUID id, ActionPlanRequest request) {
        ActionPlan plan = actionPlanRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Plano de ação não encontrado"));

        if (request.getTitle() != null) {
            plan.setTitle(request.getTitle());
        }
        if (request.getDescription() != null) {
            plan.setDescription(request.getDescription());
        }
        if (request.getObjective() != null) {
            plan.setObjective(request.getObjective());
        }
        if (request.getStatus() != null) {
            plan.setStatus(request.getStatus());
        }
        if (request.getPriority() != null) {
            plan.setPriority(request.getPriority());
        }
        if (request.getStartDate() != null) {
            plan.setStartDate(request.getStartDate());
        }
        if (request.getEndDate() != null) {
            plan.setEndDate(request.getEndDate());
        }

        plan = actionPlanRepository.save(plan);
        return convertToResponse(plan);
    }

    public void delete(UUID id) {
        ActionPlan plan = actionPlanRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Plano de ação não encontrado"));

        plan.setDeletedAt(java.time.LocalDateTime.now());
        actionPlanRepository.save(plan);
    }

    public Map<String, Long> getStats() {
        Map<String, Long> stats = new HashMap<>();
        stats.put("planning", actionPlanRepository.countByStatus(Status.PLANNING));
        stats.put("in_progress", actionPlanRepository.countByStatus(Status.IN_PROGRESS));
        stats.put("completed", actionPlanRepository.countByStatus(Status.COMPLETED));
        stats.put("cancelled", actionPlanRepository.countByStatus(Status.CANCELLED));
        return stats;
    }

    private ActionPlanResponse convertToResponse(ActionPlan plan) {
        ActionPlanResponse response = new ActionPlanResponse();
        response.setId(plan.getId());
        response.setTitle(plan.getTitle());
        response.setDescription(plan.getDescription());
        response.setObjective(plan.getObjective());
        response.setStatus(plan.getStatus());
        response.setPriority(plan.getPriority());
        response.setStartDate(plan.getStartDate());
        response.setEndDate(plan.getEndDate());
        response.setCreatedBy(plan.getCreatedBy().getId());
        response.setCreatedByName(plan.getCreatedBy().getFullName());
        response.setAssignmentCount((long) planAssignmentRepository.findByPlanId(plan.getId()).size());
        return response;
    }
}
