package com.ruoyi.pm.controller;

import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.ruoyi.common.annotation.Log;
import com.ruoyi.common.core.controller.BaseController;
import com.ruoyi.common.core.domain.AjaxResult;
import com.ruoyi.common.core.page.TableDataInfo;
import com.ruoyi.common.enums.BusinessType;
import com.ruoyi.pm.domain.PmProject;
import com.ruoyi.pm.service.IPmProjectService;

/**
 * 原型项目 控制层
 */
@RestController
@RequestMapping("/pm/project")
public class PmProjectController extends BaseController
{
    @Autowired
    private IPmProjectService pmProjectService;

    @PreAuthorize("@ss.hasPermi('pm:project:list')")
    @GetMapping("/list")
    public TableDataInfo list(PmProject query)
    {
        if (!getLoginUser().getUser().isAdmin())
        {
            query.setOwnerId(getUserId());
        }
        startPage();
        List<PmProject> list = pmProjectService.selectPmProjectList(query);
        return getDataTable(list);
    }

    @PreAuthorize("@ss.hasPermi('pm:project:query')")
    @GetMapping("/{id}")
    public AjaxResult getInfo(@PathVariable("id") Long id)
    {
        PmProject project = pmProjectService.selectPmProjectById(id);
        if (project == null)
        {
            return AjaxResult.error("项目不存在");
        }
        if (!canAccess(project))
        {
            return AjaxResult.error("无权访问该项目");
        }
        return AjaxResult.success(project);
    }

    @PreAuthorize("@ss.hasPermi('pm:project:add')")
    @Log(title = "原型项目", businessType = BusinessType.INSERT)
    @PostMapping
    public AjaxResult add(@RequestBody PmProject project)
    {
        project.setOwnerId(getUserId());
        project.setCreateBy(getUsername());
        return toAjax(pmProjectService.insertPmProject(project));
    }

    @PreAuthorize("@ss.hasPermi('pm:project:edit')")
    @Log(title = "原型项目", businessType = BusinessType.UPDATE)
    @PutMapping
    public AjaxResult edit(@RequestBody PmProject project)
    {
        PmProject existing = project.getId() == null ? null : pmProjectService.selectPmProjectById(project.getId());
        if (existing == null)
        {
            return AjaxResult.error("项目不存在");
        }
        if (!canAccess(existing))
        {
            return AjaxResult.error("无权修改该项目");
        }
        project.setOwnerId(existing.getOwnerId());
        project.setUpdateBy(getUsername());
        return toAjax(pmProjectService.updatePmProject(project));
    }

    @PreAuthorize("@ss.hasPermi('pm:project:remove')")
    @Log(title = "原型项目", businessType = BusinessType.DELETE)
    @DeleteMapping("/{ids}")
    public AjaxResult remove(@PathVariable Long[] ids)
    {
        for (Long id : ids)
        {
            PmProject existing = pmProjectService.selectPmProjectById(id);
            if (existing != null && !canAccess(existing))
            {
                return AjaxResult.error("无权删除该项目");
            }
        }
        return toAjax(pmProjectService.deletePmProjectByIds(ids));
    }

    /** 管理员可访问全部，普通用户仅能访问本人项目 */
    private boolean canAccess(PmProject project)
    {
        return getLoginUser().getUser().isAdmin() || getUserId().equals(project.getOwnerId());
    }
}
