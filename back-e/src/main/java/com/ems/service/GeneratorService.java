package com.ems.service;

import com.ems.dto.GeneratorRequest;
import com.ems.entity.Generator;
import com.ems.repository.GeneratorRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

@Service
public class GeneratorService {
    
    @Autowired
    private GeneratorRepository generatorRepository;
    
    public Generator createGenerator(GeneratorRequest request) {
        Generator generator = new Generator();
        generator.setModel(request.getModel());
        generator.setName(request.getName());
        generator.setCapacity(request.getCapacity());
        generator.setLocationName(request.getLocationName());
        generator.setOwnerEmail(request.getOwnerEmail());
        generator.setLatitude(request.getLatitude());
        generator.setLongitude(request.getLongitude());
        generator.setNote(request.getNote());
        
        return generatorRepository.save(generator);
    }
    
    public Page<Generator> getAllGenerators(Pageable pageable) {
        return generatorRepository.findAll(pageable);
    }
    
    public Generator getGeneratorById(Long id) {
        return generatorRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Generator not found"));
    }
    
    public Generator updateGenerator(Long id, GeneratorRequest request) {
        Generator generator = getGeneratorById(id);
        
        generator.setModel(request.getModel());
        generator.setName(request.getName());
        generator.setCapacity(request.getCapacity());
        generator.setLocationName(request.getLocationName());
        generator.setOwnerEmail(request.getOwnerEmail());
        generator.setLatitude(request.getLatitude());
        generator.setLongitude(request.getLongitude());
        generator.setNote(request.getNote());
        
        return generatorRepository.save(generator);
    }
    
    public void deleteGenerator(Long id) {
        generatorRepository.deleteById(id);
    }
}
