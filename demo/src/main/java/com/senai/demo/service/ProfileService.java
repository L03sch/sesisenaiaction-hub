package com.senai.demo.service;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.senai.demo.dto.profile.ProfileResponse;
import com.senai.demo.entity.Profile;
import com.senai.demo.exception.ResourceNotFoundException;
import com.senai.demo.repository.ProfileRepository;

@Service
@Transactional
public class ProfileService {

    private final ProfileRepository profileRepository;

    public ProfileService(ProfileRepository profileRepository) {
        this.profileRepository = profileRepository;
    }

    public List<ProfileResponse> findAll() {
        return profileRepository.findAll().stream()
            .map(this::convertToResponse)
            .collect(Collectors.toList());
    }

    public ProfileResponse findById(UUID id) {
        Profile profile = profileRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Perfil não encontrado"));
        return convertToResponse(profile);
    }

    public ProfileResponse update(UUID id, String fullName, String avatarUrl, String department) {
        Profile profile = profileRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Perfil não encontrado"));

        if (fullName != null) {
            profile.setFullName(fullName);
        }
        if (avatarUrl != null) {
            profile.setAvatarUrl(avatarUrl);
        }
        if (department != null) {
            profile.setDepartment(department);
        }

        profile = profileRepository.save(profile);
        return convertToResponse(profile);
    }

    public void delete(UUID id) {
        Profile profile = profileRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Perfil não encontrado"));

        profile.setDeletedAt(java.time.LocalDateTime.now());
        profileRepository.save(profile);
    }

    public void updateAvatar(UUID id, String avatarUrl) {
        Profile profile = profileRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Perfil não encontrado"));

        profile.setAvatarUrl(avatarUrl);
        profileRepository.save(profile);
    }

    private ProfileResponse convertToResponse(Profile profile) {
        ProfileResponse response = new ProfileResponse();
        response.setId(profile.getId());
        response.setEmail(profile.getEmail());
        response.setFullName(profile.getFullName());
        response.setAvatarUrl(profile.getAvatarUrl());
        response.setDepartment(profile.getDepartment());
        response.setRole(profile.getRole());
        return response;
    }
}
