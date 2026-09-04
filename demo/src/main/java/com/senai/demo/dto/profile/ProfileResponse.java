package com.senai.demo.dto.profile;

import java.util.UUID;

import com.senai.demo.entity.Profile.Role;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProfileResponse {

    private UUID id;

    private String email;

    private String fullName;

    private String avatarUrl;

    private String department;

    private Role role;
}
