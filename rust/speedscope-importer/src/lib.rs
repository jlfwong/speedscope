use js_sys::{Array, Float64Array, Int32Array, Object, Reflect, Uint32Array};
use serde::Deserialize;
use wasm_bindgen::prelude::*;

const SPEEDSCOPE_SCHEMA: &str = "https://www.speedscope.app/file-format-schema.json";
const ROOT_NODE_INDEX: i32 = -1;

#[derive(Clone, Debug, Deserialize)]
struct InputFrame {
    name: String,
    #[serde(default)]
    file: Option<String>,
    #[serde(default)]
    line: Option<u32>,
    #[serde(default)]
    col: Option<u32>,
}

#[derive(Debug, Deserialize)]
struct InputShared {
    frames: Vec<InputFrame>,
}

#[derive(Debug, Deserialize)]
#[serde(tag = "type")]
enum InputProfile {
    #[serde(rename = "sampled")]
    Sampled(InputSampledProfile),
    #[serde(other)]
    Unsupported,
}

#[derive(Debug, Deserialize)]
struct InputSampledProfile {
    name: String,
    unit: String,
    #[serde(rename = "startValue")]
    start_value: f64,
    #[serde(rename = "endValue")]
    end_value: f64,
    samples: Vec<Vec<usize>>,
    weights: Vec<f64>,
}

#[derive(Debug, Deserialize)]
struct InputFile {
    #[serde(rename = "$schema")]
    schema: Option<String>,
    shared: InputShared,
    profiles: Vec<InputProfile>,
    name: Option<String>,
    #[serde(rename = "activeProfileIndex")]
    active_profile_index: Option<usize>,
}

#[derive(Clone, Debug)]
struct OutputFrame {
    name: String,
    file: Option<String>,
    line: Option<u32>,
    col: Option<u32>,
    self_weight: f64,
    total_weight: f64,
}

#[derive(Clone, Debug)]
struct OutputNodeTable {
    frame_indices: Vec<u32>,
    parent_indices: Vec<i32>,
    self_weights: Vec<f64>,
    total_weights: Vec<f64>,
}

#[derive(Clone, Debug)]
struct OutputProfile {
    name: String,
    unit: String,
    total_weight: f64,
    frames: Vec<OutputFrame>,
    append_nodes: OutputNodeTable,
    grouped_nodes: OutputNodeTable,
    samples: Vec<i32>,
    weights: Vec<f64>,
}

#[derive(Clone, Debug)]
struct OutputProfileGroup {
    name: String,
    index_to_view: usize,
    profiles: Vec<OutputProfile>,
}

#[derive(Clone, Debug)]
struct FrameState {
    info: InputFrame,
    self_weight: f64,
    total_weight: f64,
}

#[derive(Clone, Debug)]
struct TreeNodeState {
    frame_index: usize,
    parent_index: i32,
    children: Vec<usize>,
    self_weight: f64,
    total_weight: f64,
    frozen: bool,
}

struct SampledProfileBuilder {
    frames: Vec<FrameState>,
    append_nodes: Vec<TreeNodeState>,
    append_root_children: Vec<usize>,
    append_root_self_weight: f64,
    grouped_nodes: Vec<TreeNodeState>,
    grouped_root_children: Vec<usize>,
    grouped_root_self_weight: f64,
    frame_marks: Vec<u32>,
    current_mark: u32,
    samples: Vec<i32>,
    weights: Vec<f64>,
    accumulated_weight: f64,
    initial_total_weight: f64,
}

impl SampledProfileBuilder {
    fn new(frames: &[InputFrame], initial_total_weight: f64) -> Self {
        Self {
            frames: frames
                .iter()
                .cloned()
                .map(|info| FrameState {
                    info,
                    self_weight: 0.0,
                    total_weight: 0.0,
                })
                .collect(),
            append_nodes: Vec::new(),
            append_root_children: Vec::new(),
            append_root_self_weight: 0.0,
            grouped_nodes: Vec::new(),
            grouped_root_children: Vec::new(),
            grouped_root_self_weight: 0.0,
            frame_marks: vec![0; frames.len()],
            current_mark: 1,
            samples: Vec::new(),
            weights: Vec::new(),
            accumulated_weight: 0.0,
            initial_total_weight,
        }
    }

    fn append_sample(&mut self, stack: &[usize], weight: f64) -> Result<(), String> {
        if weight == 0.0 {
            return Ok(());
        }
        if weight < 0.0 {
            return Err("Samples must have positive weights".to_owned());
        }

        self.accumulated_weight += weight;
        self.advance_mark();

        let mut append_parent = ROOT_NODE_INDEX;
        let mut grouped_parent = ROOT_NODE_INDEX;

        for &frame_index in stack {
            if frame_index >= self.frames.len() {
                return Err(format!(
                    "Sample referenced frame {} but only {} shared frames exist",
                    frame_index,
                    self.frames.len()
                ));
            }

            append_parent = self.append_step(append_parent, frame_index, weight);
            grouped_parent = self.grouped_step(grouped_parent, frame_index, weight);

            let frame_mark = &mut self.frame_marks[frame_index];
            if *frame_mark != self.current_mark {
                *frame_mark = self.current_mark;
                self.frames[frame_index].total_weight += weight;
            }
        }

        if let Some(&frame_index) = stack.last() {
            self.frames[frame_index].self_weight += weight;
        }

        self.add_node_self_weight(false, grouped_parent, weight);
        self.add_node_self_weight(true, append_parent, weight);
        self.freeze_append_children(append_parent);
        self.record_sample(append_parent, weight);

        Ok(())
    }

    fn finish(self, name: String, unit: String) -> OutputProfile {
        OutputProfile {
            name,
            unit,
            total_weight: self.initial_total_weight.max(self.accumulated_weight),
            frames: self
                .frames
                .into_iter()
                .map(|frame| OutputFrame {
                    name: frame.info.name,
                    file: frame.info.file,
                    line: frame.info.line,
                    col: frame.info.col,
                    self_weight: frame.self_weight,
                    total_weight: frame.total_weight,
                })
                .collect(),
            append_nodes: flatten_nodes(self.append_nodes),
            grouped_nodes: flatten_nodes(self.grouped_nodes),
            samples: self.samples,
            weights: self.weights,
        }
    }

    fn advance_mark(&mut self) {
        self.current_mark = self.current_mark.wrapping_add(1);
        if self.current_mark == 0 {
            self.frame_marks.fill(0);
            self.current_mark = 1;
        }
    }

    fn append_step(&mut self, parent_index: i32, frame_index: usize, weight: f64) -> i32 {
        let reuse_child = self.last_child_index(true, parent_index).filter(|&child_index| {
            let child = &self.append_nodes[child_index];
            !child.frozen && child.frame_index == frame_index
        });

        let child_index = reuse_child.unwrap_or_else(|| self.create_child(true, parent_index, frame_index));
        self.append_nodes[child_index].total_weight += weight;
        child_index as i32
    }

    fn grouped_step(&mut self, parent_index: i32, frame_index: usize, weight: f64) -> i32 {
        let existing_child = self.child_indices(false, parent_index).iter().copied().find(|&child_index| {
            self.grouped_nodes[child_index].frame_index == frame_index
        });

        let child_index = existing_child.unwrap_or_else(|| self.create_child(false, parent_index, frame_index));
        self.grouped_nodes[child_index].total_weight += weight;
        child_index as i32
    }

    fn create_child(&mut self, append_order: bool, parent_index: i32, frame_index: usize) -> usize {
        let nodes = if append_order {
            &mut self.append_nodes
        } else {
            &mut self.grouped_nodes
        };

        let child_index = nodes.len();
        nodes.push(TreeNodeState {
            frame_index,
            parent_index,
            children: Vec::new(),
            self_weight: 0.0,
            total_weight: 0.0,
            frozen: false,
        });

        self.child_indices_mut(append_order, parent_index).push(child_index);
        child_index
    }

    fn child_indices(&self, append_order: bool, parent_index: i32) -> &[usize] {
        if parent_index == ROOT_NODE_INDEX {
            if append_order {
                &self.append_root_children
            } else {
                &self.grouped_root_children
            }
        } else if append_order {
            &self.append_nodes[parent_index as usize].children
        } else {
            &self.grouped_nodes[parent_index as usize].children
        }
    }

    fn child_indices_mut(&mut self, append_order: bool, parent_index: i32) -> &mut Vec<usize> {
        if parent_index == ROOT_NODE_INDEX {
            if append_order {
                &mut self.append_root_children
            } else {
                &mut self.grouped_root_children
            }
        } else if append_order {
            &mut self.append_nodes[parent_index as usize].children
        } else {
            &mut self.grouped_nodes[parent_index as usize].children
        }
    }

    fn last_child_index(&self, append_order: bool, parent_index: i32) -> Option<usize> {
        self.child_indices(append_order, parent_index).last().copied()
    }

    fn add_node_self_weight(&mut self, append_order: bool, node_index: i32, weight: f64) {
        if node_index == ROOT_NODE_INDEX {
            if append_order {
                self.append_root_self_weight += weight;
            } else {
                self.grouped_root_self_weight += weight;
            }
            return;
        }

        let nodes = if append_order {
            &mut self.append_nodes
        } else {
            &mut self.grouped_nodes
        };
        nodes[node_index as usize].self_weight += weight;
    }

    fn freeze_append_children(&mut self, node_index: i32) {
        let child_indices = self.child_indices(true, node_index).to_vec();
        for child_index in child_indices {
            self.append_nodes[child_index].frozen = true;
        }
    }

    fn record_sample(&mut self, node_index: i32, weight: f64) {
        if self.samples.last().copied() == Some(node_index) {
            if let Some(last_weight) = self.weights.last_mut() {
                *last_weight += weight;
                return;
            }
        }

        self.samples.push(node_index);
        self.weights.push(weight);
    }
}

fn flatten_nodes(nodes: Vec<TreeNodeState>) -> OutputNodeTable {
    let mut frame_indices = Vec::with_capacity(nodes.len());
    let mut parent_indices = Vec::with_capacity(nodes.len());
    let mut self_weights = Vec::with_capacity(nodes.len());
    let mut total_weights = Vec::with_capacity(nodes.len());

    for node in nodes {
        frame_indices.push(node.frame_index as u32);
        parent_indices.push(node.parent_index);
        self_weights.push(node.self_weight);
        total_weights.push(node.total_weight);
    }

    OutputNodeTable {
        frame_indices,
        parent_indices,
        self_weights,
        total_weights,
    }
}

fn get_property(target: &JsValue, key: &str) -> Result<JsValue, JsValue> {
    Reflect::get(target, &JsValue::from_str(key))
}

fn get_optional_property(target: &JsValue, key: &str) -> Result<Option<JsValue>, JsValue> {
    let value = get_property(target, key)?;
    if value.is_null() || value.is_undefined() {
        Ok(None)
    } else {
        Ok(Some(value))
    }
}

fn get_required_string_property(target: &JsValue, key: &str) -> Result<String, JsValue> {
    get_property(target, key)?
        .as_string()
        .ok_or_else(|| JsValue::from_str(&format!("Expected `{key}` to be a string")))
}

fn get_optional_string_property(target: &JsValue, key: &str) -> Result<Option<String>, JsValue> {
    match get_optional_property(target, key)? {
        Some(value) => value
            .as_string()
            .map(Some)
            .ok_or_else(|| JsValue::from_str(&format!("Expected `{key}` to be a string"))),
        None => Ok(None),
    }
}

fn js_value_to_f64(value: &JsValue, context: &str) -> Result<f64, JsValue> {
    value
        .as_f64()
        .filter(|number| number.is_finite())
        .ok_or_else(|| JsValue::from_str(&format!("Expected `{context}` to be a finite number")))
}

fn js_value_to_usize(value: &JsValue, context: &str) -> Result<usize, JsValue> {
    let number = js_value_to_f64(value, context)?;
    if number < 0.0 || number.fract() != 0.0 || number > usize::MAX as f64 {
        return Err(JsValue::from_str(&format!(
            "Expected `{context}` to be a non-negative integer"
        )));
    }
    Ok(number as usize)
}

fn get_optional_u32_property(target: &JsValue, key: &str) -> Result<Option<u32>, JsValue> {
    match get_optional_property(target, key)? {
        Some(value) => {
            let number = js_value_to_f64(&value, key)?;
            if number < 0.0 || number.fract() != 0.0 || number > u32::MAX as f64 {
                return Err(JsValue::from_str(&format!(
                    "Expected `{key}` to be a non-negative 32-bit integer"
                )));
            }
            Ok(Some(number as u32))
        }
        None => Ok(None),
    }
}

fn get_optional_usize_property(target: &JsValue, key: &str) -> Result<Option<usize>, JsValue> {
    match get_optional_property(target, key)? {
        Some(value) => Ok(Some(js_value_to_usize(&value, key)?)),
        None => Ok(None),
    }
}

fn parse_frames_from_js(shared_frames: &JsValue) -> Result<Vec<InputFrame>, JsValue> {
    if !Array::is_array(shared_frames) {
        return Err(JsValue::from_str("Expected `shared.frames` to be an array"));
    }

    let frames = Array::from(shared_frames);
    let mut parsed_frames = Vec::with_capacity(frames.length() as usize);
    for index in 0..frames.length() {
        let frame = frames.get(index);
        parsed_frames.push(InputFrame {
            name: get_required_string_property(&frame, "name").map_err(|_| {
                JsValue::from_str(&format!("Expected `shared.frames[{index}].name` to be a string"))
            })?,
            file: get_optional_string_property(&frame, "file").map_err(|_| {
                JsValue::from_str(&format!("Expected `shared.frames[{index}].file` to be a string"))
            })?,
            line: get_optional_u32_property(&frame, "line").map_err(|_| {
                JsValue::from_str(&format!("Expected `shared.frames[{index}].line` to be a number"))
            })?,
            col: get_optional_u32_property(&frame, "col").map_err(|_| {
                JsValue::from_str(&format!("Expected `shared.frames[{index}].col` to be a number"))
            })?,
        });
    }

    Ok(parsed_frames)
}

fn set_property(target: &Object, key: &str, value: &JsValue) -> Result<(), JsValue> {
    Reflect::set(target, &JsValue::from_str(key), value)?;
    Ok(())
}

fn frame_to_js(frame: OutputFrame) -> Result<JsValue, JsValue> {
    let object = Object::new();
    set_property(&object, "name", &JsValue::from_str(&frame.name))?;
    if let Some(file) = frame.file {
        set_property(&object, "file", &JsValue::from_str(&file))?;
    }
    if let Some(line) = frame.line {
        set_property(&object, "line", &JsValue::from_f64(line as f64))?;
    }
    if let Some(col) = frame.col {
        set_property(&object, "col", &JsValue::from_f64(col as f64))?;
    }
    set_property(&object, "selfWeight", &JsValue::from_f64(frame.self_weight))?;
    set_property(&object, "totalWeight", &JsValue::from_f64(frame.total_weight))?;
    Ok(object.into())
}

fn node_table_to_js(nodes: OutputNodeTable) -> Result<JsValue, JsValue> {
    let object = Object::new();
    let frame_indices: JsValue = Uint32Array::from(nodes.frame_indices.as_slice()).into();
    let parent_indices: JsValue = Int32Array::from(nodes.parent_indices.as_slice()).into();
    let self_weights: JsValue = Float64Array::from(nodes.self_weights.as_slice()).into();
    let total_weights: JsValue = Float64Array::from(nodes.total_weights.as_slice()).into();
    set_property(&object, "frameIndices", &frame_indices)?;
    set_property(&object, "parentIndices", &parent_indices)?;
    set_property(&object, "selfWeights", &self_weights)?;
    set_property(&object, "totalWeights", &total_weights)?;
    Ok(object.into())
}

fn profile_to_js(profile: OutputProfile) -> Result<JsValue, JsValue> {
    let object = Object::new();
    set_property(&object, "name", &JsValue::from_str(&profile.name))?;
    set_property(&object, "unit", &JsValue::from_str(&profile.unit))?;
    set_property(&object, "totalWeight", &JsValue::from_f64(profile.total_weight))?;

    let frames = Array::new_with_length(profile.frames.len() as u32);
    for (index, frame) in profile.frames.into_iter().enumerate() {
        frames.set(index as u32, frame_to_js(frame)?);
    }
    set_property(&object, "frames", &frames.into())?;

    let append_nodes = node_table_to_js(profile.append_nodes)?;
    let grouped_nodes = node_table_to_js(profile.grouped_nodes)?;
    let samples: JsValue = Int32Array::from(profile.samples.as_slice()).into();
    let weights: JsValue = Float64Array::from(profile.weights.as_slice()).into();
    set_property(&object, "appendNodes", &append_nodes)?;
    set_property(&object, "groupedNodes", &grouped_nodes)?;
    set_property(&object, "samples", &samples)?;
    set_property(&object, "weights", &weights)?;

    Ok(object.into())
}

fn profile_group_to_js(profile_group: OutputProfileGroup) -> Result<JsValue, JsValue> {
    let object = Object::new();
    set_property(&object, "name", &JsValue::from_str(&profile_group.name))?;
    set_property(
        &object,
        "indexToView",
        &JsValue::from_f64(profile_group.index_to_view as f64),
    )?;

    let profiles = Array::new_with_length(profile_group.profiles.len() as u32);
    for (index, profile) in profile_group.profiles.into_iter().enumerate() {
        profiles.set(index as u32, profile_to_js(profile)?);
    }
    set_property(&object, "profiles", &profiles.into())?;

    Ok(object.into())
}

fn is_supported_schema(schema: Option<&str>) -> bool {
    match schema {
        Some(value) => value == SPEEDSCOPE_SCHEMA,
        None => true,
    }
}

fn build_profile_group(input: InputFile) -> Result<Option<OutputProfileGroup>, String> {
    if !is_supported_schema(input.schema.as_deref()) {
        return Ok(None);
    }

    let mut output_profiles = Vec::with_capacity(input.profiles.len());
    for profile in input.profiles {
        let InputProfile::Sampled(sampled) = profile else {
            return Ok(None);
        };

        if sampled.samples.len() != sampled.weights.len() {
            return Err(format!(
                "Expected samples.length ({}) to equal weights.length ({})",
                sampled.samples.len(),
                sampled.weights.len()
            ));
        }

        let mut builder =
            SampledProfileBuilder::new(&input.shared.frames, sampled.end_value - sampled.start_value);
        for (stack, weight) in sampled.samples.iter().zip(sampled.weights.iter().copied()) {
            builder.append_sample(stack, weight)?;
        }
        output_profiles.push(builder.finish(sampled.name, sampled.unit));
    }

    let group_name = input
        .name
        .or_else(|| output_profiles.first().map(|profile| profile.name.clone()))
        .unwrap_or_else(|| "profile".to_owned());

    Ok(Some(OutputProfileGroup {
        name: group_name,
        index_to_view: input.active_profile_index.unwrap_or(0),
        profiles: output_profiles,
    }))
}

fn build_profile_group_from_parsed_js(input: JsValue) -> Result<Option<OutputProfileGroup>, JsValue> {
    let schema = get_optional_string_property(&input, "$schema")?;
    if !is_supported_schema(schema.as_deref()) {
        return Ok(None);
    }

    let shared = get_property(&input, "shared")?;
    let shared_frames = get_property(&shared, "frames")?;
    let frames = parse_frames_from_js(&shared_frames)?;

    let profiles_value = get_property(&input, "profiles")?;
    if !Array::is_array(&profiles_value) {
        return Err(JsValue::from_str("Expected `profiles` to be an array"));
    }
    let profiles = Array::from(&profiles_value);

    let mut output_profiles = Vec::with_capacity(profiles.length() as usize);
    let mut stack_buffer = Vec::new();

    for profile_index in 0..profiles.length() {
        let profile = profiles.get(profile_index);
        let profile_type = get_required_string_property(&profile, "type").map_err(|_| {
            JsValue::from_str(&format!("Expected `profiles[{profile_index}].type` to be a string"))
        })?;
        if profile_type != "sampled" {
            return Ok(None);
        }

        let name = get_required_string_property(&profile, "name").map_err(|_| {
            JsValue::from_str(&format!("Expected `profiles[{profile_index}].name` to be a string"))
        })?;
        let unit = get_required_string_property(&profile, "unit").map_err(|_| {
            JsValue::from_str(&format!("Expected `profiles[{profile_index}].unit` to be a string"))
        })?;
        let start_value = js_value_to_f64(
            &get_property(&profile, "startValue")?,
            &format!("profiles[{profile_index}].startValue"),
        )?;
        let end_value = js_value_to_f64(
            &get_property(&profile, "endValue")?,
            &format!("profiles[{profile_index}].endValue"),
        )?;

        let samples_value = get_property(&profile, "samples")?;
        let weights_value = get_property(&profile, "weights")?;
        if !Array::is_array(&samples_value) {
            return Err(JsValue::from_str(&format!(
                "Expected `profiles[{profile_index}].samples` to be an array"
            )));
        }
        if !Array::is_array(&weights_value) {
            return Err(JsValue::from_str(&format!(
                "Expected `profiles[{profile_index}].weights` to be an array"
            )));
        }

        let samples = Array::from(&samples_value);
        let weights = Array::from(&weights_value);
        if samples.length() != weights.length() {
            return Err(JsValue::from_str(&format!(
                "Expected profiles[{profile_index}].samples.length ({}) to equal weights.length ({})",
                samples.length(),
                weights.length()
            )));
        }

        let mut builder = SampledProfileBuilder::new(&frames, end_value - start_value);
        for sample_index in 0..samples.length() {
            let stack_value = samples.get(sample_index);
            if !Array::is_array(&stack_value) {
                return Err(JsValue::from_str(&format!(
                    "Expected `profiles[{profile_index}].samples[{sample_index}]` to be an array"
                )));
            }

            let stack = Array::from(&stack_value);
            stack_buffer.clear();
            if stack_buffer.capacity() < stack.length() as usize {
                stack_buffer.reserve(stack.length() as usize - stack_buffer.capacity());
            }

            for frame_index in 0..stack.length() {
                let context =
                    format!("profiles[{profile_index}].samples[{sample_index}][{frame_index}]");
                stack_buffer.push(js_value_to_usize(&stack.get(frame_index), &context)?);
            }

            let weight_context = format!("profiles[{profile_index}].weights[{sample_index}]");
            let weight = js_value_to_f64(&weights.get(sample_index), &weight_context)?;
            builder
                .append_sample(&stack_buffer, weight)
                .map_err(|error| JsValue::from_str(&error))?;
        }

        output_profiles.push(builder.finish(name, unit));
    }

    let group_name = get_optional_string_property(&input, "name")?
        .or_else(|| output_profiles.first().map(|profile| profile.name.clone()))
        .unwrap_or_else(|| "profile".to_owned());

    Ok(Some(OutputProfileGroup {
        name: group_name,
        index_to_view: get_optional_usize_property(&input, "activeProfileIndex")?.unwrap_or(0),
        profiles: output_profiles,
    }))
}

fn build_profile_group_from_flattened_js(input: JsValue) -> Result<Option<OutputProfileGroup>, JsValue> {
    let schema = get_optional_string_property(&input, "$schema")?;
    if !is_supported_schema(schema.as_deref()) {
        return Ok(None);
    }

    let shared = get_property(&input, "shared")?;
    let shared_frames = get_property(&shared, "frames")?;
    let frames = parse_frames_from_js(&shared_frames)?;

    let profiles_value = get_property(&input, "profiles")?;
    if !Array::is_array(&profiles_value) {
        return Err(JsValue::from_str("Expected `profiles` to be an array"));
    }
    let profiles = Array::from(&profiles_value);

    let mut output_profiles = Vec::with_capacity(profiles.length() as usize);
    let mut stack_buffer = Vec::new();

    for profile_index in 0..profiles.length() {
        let profile = profiles.get(profile_index);
        let profile_type = get_required_string_property(&profile, "type").map_err(|_| {
            JsValue::from_str(&format!("Expected `profiles[{profile_index}].type` to be a string"))
        })?;
        if profile_type != "sampled" {
            return Ok(None);
        }

        let name = get_required_string_property(&profile, "name").map_err(|_| {
            JsValue::from_str(&format!("Expected `profiles[{profile_index}].name` to be a string"))
        })?;
        let unit = get_required_string_property(&profile, "unit").map_err(|_| {
            JsValue::from_str(&format!("Expected `profiles[{profile_index}].unit` to be a string"))
        })?;
        let start_value = js_value_to_f64(
            &get_property(&profile, "startValue")?,
            &format!("profiles[{profile_index}].startValue"),
        )?;
        let end_value = js_value_to_f64(
            &get_property(&profile, "endValue")?,
            &format!("profiles[{profile_index}].endValue"),
        )?;

        let sample_offsets = Uint32Array::new(&get_property(&profile, "sampleOffsets")?);
        let sample_frames = Uint32Array::new(&get_property(&profile, "sampleFrames")?);
        let weights = Float64Array::new(&get_property(&profile, "weights")?);

        if sample_offsets.length() != weights.length() + 1 {
            return Err(JsValue::from_str(&format!(
                "Expected profiles[{profile_index}].sampleOffsets.length ({}) to equal weights.length + 1 ({})",
                sample_offsets.length(),
                weights.length() + 1
            )));
        }

        let mut builder = SampledProfileBuilder::new(&frames, end_value - start_value);
        for sample_index in 0..weights.length() {
            let start = sample_offsets.get_index(sample_index) as usize;
            let end = sample_offsets.get_index(sample_index + 1) as usize;
            if end < start || end > sample_frames.length() as usize {
                return Err(JsValue::from_str(&format!(
                    "Invalid sample frame range [{start}, {end}) for profiles[{profile_index}].samples[{sample_index}]"
                )));
            }

            stack_buffer.clear();
            if stack_buffer.capacity() < end - start {
                stack_buffer.reserve(end - start - stack_buffer.capacity());
            }

            for frame_index in start..end {
                stack_buffer.push(sample_frames.get_index(frame_index as u32) as usize);
            }

            builder
                .append_sample(&stack_buffer, weights.get_index(sample_index))
                .map_err(|error| JsValue::from_str(&error))?;
        }

        output_profiles.push(builder.finish(name, unit));
    }

    let group_name = get_optional_string_property(&input, "name")?
        .or_else(|| output_profiles.first().map(|profile| profile.name.clone()))
        .unwrap_or_else(|| "profile".to_owned());

    Ok(Some(OutputProfileGroup {
        name: group_name,
        index_to_view: get_optional_usize_property(&input, "activeProfileIndex")?.unwrap_or(0),
        profiles: output_profiles,
    }))
}

#[wasm_bindgen]
pub fn import_speedscope_sampled_profile_group(buffer: &[u8]) -> Result<JsValue, JsValue> {
    let parsed: InputFile = serde_json::from_slice(buffer)
        .map_err(|error| JsValue::from_str(&format!("Failed to parse sampled speedscope JSON: {error}")))?;

    match build_profile_group(parsed).map_err(|error| JsValue::from_str(&error))? {
        Some(profile_group) => profile_group_to_js(profile_group),
        None => Ok(JsValue::NULL),
    }
}

#[wasm_bindgen]
pub fn import_speedscope_sampled_profile_group_from_parsed(input: JsValue) -> Result<JsValue, JsValue> {
    match build_profile_group_from_parsed_js(input)? {
        Some(profile_group) => profile_group_to_js(profile_group),
        None => Ok(JsValue::NULL),
    }
}

#[wasm_bindgen]
pub fn import_speedscope_sampled_profile_group_from_flattened(input: JsValue) -> Result<JsValue, JsValue> {
    match build_profile_group_from_flattened_js(input)? {
        Some(profile_group) => profile_group_to_js(profile_group),
        None => Ok(JsValue::NULL),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn sampled_import_builds_expected_profile_group() {
        let input = br#"{
          "$schema": "https://www.speedscope.app/file-format-schema.json",
          "shared": {
            "frames": [{"name": "a"}, {"name": "b"}, {"name": "c"}, {"name": "d"}, {"name": "e"}]
          },
          "profiles": [{
            "type": "sampled",
            "name": "sample",
            "unit": "none",
            "startValue": 0,
            "endValue": 0,
            "samples": [[0], [0,1], [0,1], [0,1,3], [0,1,2], [], [0], [0,1], [0,1,1], [0,1,4], [0]],
            "weights": [1,1,1,1,1,1,1,1,1,1,1]
          }],
          "activeProfileIndex": 0
        }"#;

        let parsed: InputFile = serde_json::from_slice(input).expect("sample input should parse");
        let result = build_profile_group(parsed)
            .expect("sample input should build")
            .expect("sample input should be supported");

        let profile = result.profiles.first().expect("expected one profile");
        assert_eq!(result.name, "sample");
        assert_eq!(profile.frames.len(), 5);
        assert_eq!(profile.append_nodes.frame_indices.len(), 8);
        assert_eq!(profile.grouped_nodes.frame_indices.len(), 6);
        assert_eq!(profile.samples.len(), profile.weights.len());
        assert!(profile.samples.contains(&ROOT_NODE_INDEX));
        assert_eq!(profile.weights.iter().sum::<f64>(), 11.0);
        assert_eq!(profile.total_weight, 11.0);
        assert_eq!(profile.frames[1].total_weight, 7.0);
        assert!(profile.frames[1].self_weight > 0.0);
    }

    #[test]
    fn unsupported_profile_types_fall_back() {
        let input = br#"{
          "shared": {"frames": [{"name": "a"}]},
          "profiles": [{
            "type": "evented",
            "name": "sample",
            "unit": "none",
            "startValue": 0,
            "endValue": 1,
            "events": []
          }]
        }"#;

        let parsed: InputFile = serde_json::from_slice(input).expect("evented input should parse");
        let result = build_profile_group(parsed).expect("evented input should not error");
        assert!(result.is_none());
    }
}
