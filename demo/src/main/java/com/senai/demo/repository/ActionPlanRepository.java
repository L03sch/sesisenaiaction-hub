package com.senai.demo.repository;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.senai.demo.entity.ActionPlan;
import com.senai.demo.entity.ActionPlan.Status;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

@Repository
public interface ActionPlanRepository extends JpaRepository<ActionPlan, UUID> {

    Page<ActionPlan> findByStatus(Status status, Pageable pageable);

    long countByStatus(Status status);
}
