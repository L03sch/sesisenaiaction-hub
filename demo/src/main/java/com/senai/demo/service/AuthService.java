package com.senai.demo.service;

import java.util.UUID;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.senai.demo.dto.auth.AuthResponse;
import com.senai.demo.dto.auth.LoginRequest;
import com.senai.demo.dto.auth.SignUpRequest;
import com.senai.demo.entity.Profile;
import com.senai.demo.exception.ResourceNotFoundException;
import com.senai.demo.exception.ValidationException;
import com.senai.demo.repository.ProfileRepository;
import com.senai.demo.security.JwtTokenProvider;

@Service
@Transactional
public class AuthService {

    private final ProfileRepository profileRepository;

    private final PasswordEncoder passwordEncoder;

    private final JwtTokenProvider jwtTokenProvider;

    public AuthService(ProfileRepository profileRepository, PasswordEncoder passwordEncoder,
                       JwtTokenProvider jwtTokenProvider) {
        this.profileRepository = profileRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtTokenProvider = jwtTokenProvider;
    }

    public AuthResponse signup(SignUpRequest request) {
        if (profileRepository.existsByEmail(request.getEmail())) {
            throw new ValidationException("Email já cadastrado");
        }

        Profile profile = new Profile();
        profile.setEmail(request.getEmail());
        profile.setFullName(request.getFullName());
        profile.setDepartment(request.getDepartment());
        profile.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        profile.setRole(Profile.Role.USER);

        profile = profileRepository.save(profile);

        return buildAuthResponse(profile);
    }

    public AuthResponse login(LoginRequest request) {
        Profile profile = profileRepository.findByEmail(request.getEmail())
            .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado"));

        if (!passwordEncoder.matches(request.getPassword(), profile.getPasswordHash())) {
            throw new ValidationException("Senha incorreta");
        }

        return buildAuthResponse(profile);
    }

    public AuthResponse refreshToken(String userId) {
        Profile profile = profileRepository.findById(UUID.fromString(userId))
            .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado"));

        return buildAuthResponse(profile);
    }

    private AuthResponse buildAuthResponse(Profile profile) {
        String token = jwtTokenProvider.generateToken(profile.getId().toString());
        String refreshToken = jwtTokenProvider.generateRefreshToken(profile.getId().toString());

        AuthResponse response = new AuthResponse();
        response.setToken(token);
        response.setRefreshToken(refreshToken);
        response.setUserId(profile.getId());
        response.setEmail(profile.getEmail());
        response.setFullName(profile.getFullName());
        response.setAvatarUrl(profile.getAvatarUrl());
        response.setDepartment(profile.getDepartment());
        response.setRole(profile.getRole());
        response.setExpiresIn(3600L);

        return response;
    }
}
