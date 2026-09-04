package com.senai.demo.dto.plan;

import java.util.UUID;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PlanAssignmentRequest {

    @NotNull(message = "ID do plano é obrigatório")
    private UUID planId;

    @NotNull(message = "ID do professor é obrigatório")
    private UUID professorId;
}
