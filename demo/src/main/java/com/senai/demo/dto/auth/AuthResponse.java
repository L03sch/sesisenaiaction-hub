package com.senai.demo.dto.auth;

import java.util.UUID;

import com.senai.demo.entity.Profile.Role;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {

    private String token;

    private String refreshToken;

    private UUID userId;

    private String email;

    private String fullName;

    private String avatarUrl;

    private String department;

    private Role role;

    private Long expiresIn;
}
