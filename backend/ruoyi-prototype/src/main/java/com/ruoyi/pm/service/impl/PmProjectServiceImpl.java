package com.ruoyi.pm.service.impl;

import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.ruoyi.pm.domain.PmProject;
import com.ruoyi.pm.mapper.PmProjectMapper;
import com.ruoyi.pm.service.IPmProjectService;

/**
 * 原型项目 服务实现
 */
@Service
public class PmProjectServiceImpl implements IPmProjectService
{
    @Autowired
    private PmProjectMapper pmProjectMapper;

    @Override
    public List<PmProject> selectPmProjectList(PmProject query)
    {
        return pmProjectMapper.selectPmProjectList(query);
    }

    @Override
    public PmProject selectPmProjectById(Long id)
    {
        return pmProjectMapper.selectPmProjectById(id);
    }

    @Override
    public int insertPmProject(PmProject project)
    {
        return pmProjectMapper.insertPmProject(project);
    }

    @Override
    public int updatePmProject(PmProject project)
    {
        return pmProjectMapper.updatePmProject(project);
    }

    @Override
    public int deletePmProjectByIds(Long[] ids)
    {
        return pmProjectMapper.deletePmProjectByIds(ids);
    }

    @Override
    public int deletePmProjectById(Long id)
    {
        return pmProjectMapper.deletePmProjectById(id);
    }
}
