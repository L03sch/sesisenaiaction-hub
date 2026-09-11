package com.senai.demo.dto.plan;

import java.time.LocalDate;

import com.senai.demo.entity.ActionPlan.Priority;
import com.senai.demo.entity.ActionPlan.Status;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ActionPlanRequest {

    @NotBlank(message = "Título é obrigatório")
    private String title;

    private String description;

    private String objective;

    private Status status;

    private Priority priority;

    @NotNull(message = "Data de início é obrigatória")
    private LocalDate startDate;

    @NotNull(message = "Data de fim é obrigatória")
    private LocalDate endDate;
}
