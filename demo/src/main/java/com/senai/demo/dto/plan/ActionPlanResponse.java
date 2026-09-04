package com.senai.demo.dto.plan;

import java.time.LocalDate;
import java.util.UUID;

import com.senai.demo.entity.ActionPlan.Priority;
import com.senai.demo.entity.ActionPlan.Status;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ActionPlanResponse {

    private UUID id;

    private String title;

    private String description;

    private String objective;

    private Status status;

    private Priority priority;

    private LocalDate startDate;

    private LocalDate endDate;

    private UUID createdBy;

    private String createdByName;

    private Long assignmentCount;
}
