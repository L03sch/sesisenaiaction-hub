package com.senai.demo.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.senai.demo.entity.PlanAssignment;

@Repository
public interface PlanAssignmentRepository extends JpaRepository<PlanAssignment, UUID> {

    List<PlanAssignment> findByPlanId(UUID planId);

    List<PlanAssignment> findByProfessorId(UUID professorId);
}
