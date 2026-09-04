package com.senai.demo.entity;

import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "plan_assignments")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PlanAssignment extends BaseEntity {

    @ManyToOne
    @JoinColumn(name = "plan_id", nullable = false)
    private ActionPlan plan;

    @ManyToOne
    @JoinColumn(name = "professor_id", nullable = false)
    private Profile professor;
}
